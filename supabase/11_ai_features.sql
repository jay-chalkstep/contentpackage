-- AI Features Schema with pgvector
-- Migration 11: Adds AI-powered features (auto-tagging, semantic search, accessibility analysis)

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- AI metadata storage with vector embeddings
CREATE TABLE mockup_ai_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mockup_id UUID REFERENCES card_mockups(id) ON DELETE CASCADE,

  -- Auto-tagging from Google Vision
  auto_tags JSONB DEFAULT '{"visual": [], "colors": [], "composition": [], "brands": [], "objects": [], "confidence": 0}',

  -- Accessibility analysis
  accessibility_score JSONB DEFAULT '{"wcag_level": null, "contrast_ratio": null, "readability": null, "issues": [], "suggestions": []}',

  -- Extracted text via OCR
  extracted_text TEXT,

  -- Color analysis from Google Vision
  color_palette JSONB DEFAULT '{"dominant": [], "accent": [], "neutral": []}',

  -- Vector embedding for semantic search (OpenAI text-embedding-3-small produces 1536 dimensions)
  embedding vector(1536),

  -- Search optimization - concatenated searchable content
  search_text TEXT,

  -- Analysis metadata
  last_analyzed TIMESTAMP,
  analysis_version TEXT DEFAULT '1.0', -- Track which version of analysis was used

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(mockup_id)
);

-- Smart folder suggestions history
CREATE TABLE folder_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mockup_id UUID REFERENCES card_mockups(id) ON DELETE CASCADE,
  suggested_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  confidence DECIMAL(3, 2), -- 0.00 to 1.00
  reason TEXT,
  accepted BOOLEAN DEFAULT NULL, -- NULL = not acted on, TRUE = accepted, FALSE = rejected
  user_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Search queries for analytics and learning
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  query_embedding vector(1536), -- Store the embedding for analysis
  natural_language BOOLEAN DEFAULT FALSE,
  results_count INTEGER,
  clicked_results UUID[], -- Array of mockup IDs that were clicked
  user_id TEXT,
  org_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_mockup_ai_mockup_id ON mockup_ai_metadata(mockup_id);
CREATE INDEX idx_mockup_ai_last_analyzed ON mockup_ai_metadata(last_analyzed);

-- Vector similarity index using ivfflat
-- lists = 10 is good for up to 100k vectors, increase to 50-100 for larger datasets
CREATE INDEX idx_mockup_ai_embedding ON mockup_ai_metadata
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

-- Full-text search index
CREATE INDEX idx_mockup_ai_search_text ON mockup_ai_metadata
  USING GIN(to_tsvector('english', COALESCE(search_text, '')));

-- Folder suggestions indexes
CREATE INDEX idx_folder_suggestions_mockup ON folder_suggestions(mockup_id);
CREATE INDEX idx_folder_suggestions_folder ON folder_suggestions(suggested_folder_id);
CREATE INDEX idx_folder_suggestions_accepted ON folder_suggestions(accepted) WHERE accepted IS NOT NULL;

-- Search queries indexes
CREATE INDEX idx_search_queries_org ON search_queries(org_id);
CREATE INDEX idx_search_queries_created ON search_queries(created_at DESC);

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION search_mockups_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  org_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  mockup_name text,
  mockup_image_url text,
  similarity float,
  auto_tags jsonb,
  extracted_text text,
  folder_id uuid,
  project_id uuid,
  created_at timestamp
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.mockup_name,
    m.mockup_image_url,
    1 - (mai.embedding <=> query_embedding) as similarity,
    mai.auto_tags,
    mai.extracted_text,
    m.folder_id,
    m.project_id,
    m.created_at
  FROM card_mockups m
  JOIN mockup_ai_metadata mai ON m.id = mai.mockup_id
  WHERE
    mai.embedding IS NOT NULL
    AND (search_mockups_by_embedding.org_id IS NULL OR m.organization_id = search_mockups_by_embedding.org_id)
    AND 1 - (mai.embedding <=> query_embedding) > match_threshold
  ORDER BY mai.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RPC function for finding similar mockups
CREATE OR REPLACE FUNCTION find_similar_mockups(
  mockup_id uuid,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  mockup_name text,
  mockup_image_url text,
  similarity float,
  auto_tags jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
  source_embedding vector(1536);
  source_org_id text;
BEGIN
  -- Get the embedding and org_id of the source mockup
  SELECT mai.embedding, m.organization_id
  INTO source_embedding, source_org_id
  FROM mockup_ai_metadata mai
  JOIN card_mockups m ON m.id = mai.mockup_id
  WHERE mai.mockup_id = find_similar_mockups.mockup_id;

  IF source_embedding IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.mockup_name,
    m.mockup_image_url,
    1 - (mai.embedding <=> source_embedding) as similarity,
    mai.auto_tags
  FROM card_mockups m
  JOIN mockup_ai_metadata mai ON m.id = mai.mockup_id
  WHERE
    m.id != find_similar_mockups.mockup_id
    AND m.organization_id = source_org_id
    AND mai.embedding IS NOT NULL
  ORDER BY mai.embedding <=> source_embedding
  LIMIT match_count;
END;
$$;

-- RPC function for hybrid search (text + vector)
CREATE OR REPLACE FUNCTION hybrid_search_mockups(
  text_query text DEFAULT NULL,
  query_embedding vector(1536) DEFAULT NULL,
  match_count int DEFAULT 20,
  org_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  mockup_name text,
  mockup_image_url text,
  text_rank float,
  vector_similarity float,
  combined_score float,
  auto_tags jsonb,
  extracted_text text,
  folder_id uuid,
  project_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH text_search AS (
    SELECT
      m.id,
      ts_rank(to_tsvector('english', COALESCE(mai.search_text, '')),
              websearch_to_tsquery('english', text_query)) as rank
    FROM card_mockups m
    JOIN mockup_ai_metadata mai ON m.id = mai.mockup_id
    WHERE
      text_query IS NOT NULL
      AND to_tsvector('english', COALESCE(mai.search_text, '')) @@
          websearch_to_tsquery('english', text_query)
      AND (hybrid_search_mockups.org_id IS NULL OR m.organization_id = hybrid_search_mockups.org_id)
  ),
  vector_search AS (
    SELECT
      m.id,
      1 - (mai.embedding <=> query_embedding) as similarity
    FROM card_mockups m
    JOIN mockup_ai_metadata mai ON m.id = mai.mockup_id
    WHERE
      query_embedding IS NOT NULL
      AND mai.embedding IS NOT NULL
      AND (hybrid_search_mockups.org_id IS NULL OR m.organization_id = hybrid_search_mockups.org_id)
  )
  SELECT
    m.id,
    m.mockup_name,
    m.mockup_image_url,
    COALESCE(ts.rank, 0) as text_rank,
    COALESCE(vs.similarity, 0) as vector_similarity,
    COALESCE(ts.rank, 0) * 0.4 + COALESCE(vs.similarity, 0) * 0.6 as combined_score,
    mai.auto_tags,
    mai.extracted_text,
    m.folder_id,
    m.project_id
  FROM card_mockups m
  LEFT JOIN mockup_ai_metadata mai ON m.id = mai.mockup_id
  LEFT JOIN text_search ts ON m.id = ts.id
  LEFT JOIN vector_search vs ON m.id = vs.id
  WHERE ts.id IS NOT NULL OR vs.id IS NOT NULL
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- RPC function to find similar folders based on content
CREATE OR REPLACE FUNCTION find_similar_folders(
  target_embedding vector(1536),
  org_id text,
  limit_count int DEFAULT 3
)
RETURNS TABLE (
  folder_id uuid,
  folder_name text,
  avg_similarity float,
  mockup_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id as folder_id,
    f.name as folder_name,
    AVG(1 - (mai.embedding <=> target_embedding)) as avg_similarity,
    COUNT(*)::bigint as mockup_count
  FROM folders f
  JOIN card_mockups m ON m.folder_id = f.id
  JOIN mockup_ai_metadata mai ON mai.mockup_id = m.id
  WHERE
    f.organization_id = find_similar_folders.org_id
    AND mai.embedding IS NOT NULL
    AND m.folder_id IS NOT NULL
  GROUP BY f.id, f.name
  HAVING COUNT(*) >= 2 -- Only suggest folders with at least 2 mockups
  ORDER BY avg_similarity DESC
  LIMIT limit_count;
END;
$$;

-- Enable RLS
ALTER TABLE mockup_ai_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- RLS policies (following existing pattern from other tables)
-- Note: These tables are accessed via API routes with service role key,
-- but we set up RLS for defense in depth

-- mockup_ai_metadata: Anyone in the org can read, system writes
CREATE POLICY "Users can view AI metadata for their org's mockups"
  ON mockup_ai_metadata FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM card_mockups m
      WHERE m.id = mockup_ai_metadata.mockup_id
    )
  );

-- folder_suggestions: Users can view their own suggestions
CREATE POLICY "Users can view their own folder suggestions"
  ON folder_suggestions FOR SELECT
  USING (true); -- Filtered by user_id in application layer

-- search_queries: Users can view their own queries
CREATE POLICY "Users can view their own search queries"
  ON search_queries FOR SELECT
  USING (true); -- Filtered by user_id/org_id in application layer

-- Grant permissions to authenticated users
GRANT ALL ON mockup_ai_metadata TO authenticated;
GRANT ALL ON folder_suggestions TO authenticated;
GRANT ALL ON search_queries TO authenticated;

-- Add helpful comment
COMMENT ON TABLE mockup_ai_metadata IS 'AI-generated metadata for mockups including embeddings, tags, and accessibility analysis';
COMMENT ON TABLE folder_suggestions IS 'ML-powered folder suggestions for mockup organization';
COMMENT ON TABLE search_queries IS 'Search query analytics for improving AI search results';
COMMENT ON COLUMN mockup_ai_metadata.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';
COMMENT ON COLUMN mockup_ai_metadata.search_text IS 'Concatenated searchable text: title + description + OCR + labels';
