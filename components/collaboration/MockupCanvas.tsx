'use client';

import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Arrow, Circle, Rect, Line, Text } from 'react-konva';
import { CardMockup } from '@/lib/supabase';
import { Comment, AnnotationTool } from '@/app/(dashboard)/mockups/[id]/page';
import { useUser, useOrganization } from '@clerk/nextjs';
import Konva from 'konva';

interface MockupCanvasProps {
  mockup: CardMockup;
  comments: Comment[];
  activeTool: AnnotationTool;
  strokeColor: string;
  strokeWidth: number;
  onCommentCreate: (commentData: any) => void;
  isCreator: boolean;
  isReviewer: boolean;
}

export default function MockupCanvas({
  mockup,
  comments,
  activeTool,
  strokeColor,
  strokeWidth,
  onCommentCreate,
  isCreator,
  isReviewer
}: MockupCanvasProps) {
  const { user } = useUser();
  const { organization } = useOrganization();
  const stageRef = useRef<Konva.Stage>(null);
  const [mockupImage, setMockupImage] = useState<HTMLImageElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState('');
  const [pendingAnnotationData, setPendingAnnotationData] = useState<any>(null);

  // Load mockup image
  useEffect(() => {
    if (!mockup.mockup_image_url) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = mockup.mockup_image_url;
    img.onload = () => {
      setMockupImage(img);

      // Calculate canvas dimensions to fit viewport while maintaining aspect ratio
      const container = document.getElementById('canvas-container');
      if (container) {
        const containerWidth = container.clientWidth - 64; // Account for padding
        const containerHeight = container.clientHeight - 64; // Account for padding
        const imageAspectRatio = img.width / img.height;

        let canvasWidth = containerWidth;
        let canvasHeight = canvasWidth / imageAspectRatio;

        // If height is too tall, constrain by height instead
        if (canvasHeight > containerHeight) {
          canvasHeight = containerHeight;
          canvasWidth = canvasHeight * imageAspectRatio;
        }

        setCanvasDimensions({ width: canvasWidth, height: canvasHeight });
      }
    };
  }, [mockup.mockup_image_url]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mockupImage) {
        const container = document.getElementById('canvas-container');
        if (container) {
          const containerWidth = container.clientWidth - 64; // Account for padding
          const containerHeight = container.clientHeight - 64; // Account for padding
          const imageAspectRatio = mockupImage.width / mockupImage.height;

          let canvasWidth = containerWidth;
          let canvasHeight = canvasWidth / imageAspectRatio;

          // If height is too tall, constrain by height instead
          if (canvasHeight > containerHeight) {
            canvasHeight = containerHeight;
            canvasWidth = canvasHeight * imageAspectRatio;
          }

          setCanvasDimensions({ width: canvasWidth, height: canvasHeight });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mockupImage]);

  // Export functionality
  useEffect(() => {
    const handleExport = (e: any) => {
      const { includeAnnotations } = e.detail;
      exportMockup(includeAnnotations);
    };

    window.addEventListener('export-mockup', handleExport);
    return () => window.removeEventListener('export-mockup', handleExport);
  }, [comments]);

  const exportMockup = (includeAnnotations: boolean) => {
    if (!stageRef.current) return;

    const stage = stageRef.current;

    // Hide or show annotation layer based on option
    const annotationLayer = stage.findOne('.annotation-layer');
    if (annotationLayer && !includeAnnotations) {
      annotationLayer.hide();
    }

    // Export as high-res image
    const dataURL = stage.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png'
    });

    // Show annotation layer again
    if (annotationLayer && !includeAnnotations) {
      annotationLayer.show();
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `${mockup.mockup_name}${includeAnnotations ? '-annotated' : ''}.png`;
    link.href = dataURL;
    link.click();
  };

  const handleMouseDown = (e: any) => {
    if (activeTool === 'select' || !(isCreator || isReviewer)) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    setIsDrawing(true);

    // Handle different tools
    switch (activeTool) {
      case 'pin':
        // Place pin and immediately show comment dialog
        setCommentPosition({ x: pointerPos.x, y: pointerPos.y });
        setPendingAnnotationData({
          type: 'pin',
          position_x: (pointerPos.x / canvasDimensions.width) * 100,
          position_y: (pointerPos.y / canvasDimensions.height) * 100,
          annotation_color: strokeColor
        });
        setShowCommentDialog(true);
        setIsDrawing(false);
        break;

      case 'arrow':
        setCurrentShape({
          type: 'arrow',
          points: [pointerPos.x, pointerPos.y, pointerPos.x, pointerPos.y],
          stroke: strokeColor,
          strokeWidth,
          pointerLength: 10,
          pointerWidth: 10
        });
        break;

      case 'circle':
        setCurrentShape({
          type: 'circle',
          x: pointerPos.x,
          y: pointerPos.y,
          radius: 0,
          stroke: strokeColor,
          strokeWidth
        });
        break;

      case 'rect':
        setCurrentShape({
          type: 'rect',
          x: pointerPos.x,
          y: pointerPos.y,
          width: 0,
          height: 0,
          stroke: strokeColor,
          strokeWidth
        });
        break;

      case 'freehand':
        setCurrentShape({
          type: 'freehand',
          points: [pointerPos.x, pointerPos.y],
          stroke: strokeColor,
          strokeWidth
        });
        break;

      case 'text':
        setCommentPosition({ x: pointerPos.x, y: pointerPos.y });
        setPendingAnnotationData({
          type: 'text',
          x: pointerPos.x,
          y: pointerPos.y,
          text: '',
          fontSize: 16,
          fill: strokeColor
        });
        setShowCommentDialog(true);
        setIsDrawing(false);
        break;
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !currentShape) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Update current shape based on tool
    switch (activeTool) {
      case 'arrow':
        setCurrentShape({
          ...currentShape,
          points: [
            currentShape.points[0],
            currentShape.points[1],
            pointerPos.x,
            pointerPos.y
          ]
        });
        break;

      case 'circle':
        const radiusX = Math.abs(pointerPos.x - currentShape.x);
        const radiusY = Math.abs(pointerPos.y - currentShape.y);
        const radius = Math.sqrt(radiusX * radiusX + radiusY * radiusY);
        setCurrentShape({
          ...currentShape,
          radius
        });
        break;

      case 'rect':
        setCurrentShape({
          ...currentShape,
          width: pointerPos.x - currentShape.x,
          height: pointerPos.y - currentShape.y
        });
        break;

      case 'freehand':
        setCurrentShape({
          ...currentShape,
          points: [...currentShape.points, pointerPos.x, pointerPos.y]
        });
        break;
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;

    setIsDrawing(false);

    // Show comment dialog with annotation data
    const centerX = activeTool === 'arrow'
      ? (currentShape.points[0] + currentShape.points[2]) / 2
      : currentShape.x || 0;
    const centerY = activeTool === 'arrow'
      ? (currentShape.points[1] + currentShape.points[3]) / 2
      : currentShape.y || 0;

    setCommentPosition({ x: centerX, y: centerY });
    setPendingAnnotationData(currentShape);
    setShowCommentDialog(true);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !pendingAnnotationData) return;

    try {
      // Calculate position percentages
      const position_x = activeTool === 'pin'
        ? pendingAnnotationData.position_x
        : (commentPosition.x / canvasDimensions.width) * 100;
      const position_y = activeTool === 'pin'
        ? pendingAnnotationData.position_y
        : (commentPosition.y / canvasDimensions.height) * 100;

      const response = await fetch(`/api/mockups/${mockup.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_text: commentText,
          annotation_data: pendingAnnotationData,
          position_x,
          position_y,
          annotation_type: activeTool,
          annotation_color: strokeColor
        })
      });

      if (!response.ok) throw new Error('Failed to create comment');

      // Reset state
      setCommentText('');
      setCurrentShape(null);
      setPendingAnnotationData(null);
      setShowCommentDialog(false);
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to create comment');
    }
  };

  // Render annotation from comment data
  const renderAnnotation = (comment: Comment) => {
    if (!comment.annotation_data) return null;

    const data = comment.annotation_data;
    const key = `annotation-${comment.id}`;

    switch (comment.annotation_type) {
      case 'arrow':
        return (
          <Arrow
            key={key}
            points={data.points}
            stroke={comment.annotation_color || '#FF6B6B'}
            strokeWidth={data.strokeWidth || 3}
            pointerLength={data.pointerLength || 10}
            pointerWidth={data.pointerWidth || 10}
          />
        );

      case 'circle':
        return (
          <Circle
            key={key}
            x={data.x}
            y={data.y}
            radius={data.radius}
            stroke={comment.annotation_color || '#FF6B6B'}
            strokeWidth={data.strokeWidth || 3}
          />
        );

      case 'rect':
        return (
          <Rect
            key={key}
            x={data.x}
            y={data.y}
            width={data.width}
            height={data.height}
            stroke={comment.annotation_color || '#FF6B6B'}
            strokeWidth={data.strokeWidth || 3}
          />
        );

      case 'freehand':
        return (
          <Line
            key={key}
            points={data.points}
            stroke={comment.annotation_color || '#FF6B6B'}
            strokeWidth={data.strokeWidth || 3}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );

      case 'text':
        return (
          <Text
            key={key}
            x={data.x}
            y={data.y}
            text={data.text || comment.comment_text}
            fontSize={data.fontSize || 16}
            fill={comment.annotation_color || '#FF6B6B'}
            fontFamily="Arial"
          />
        );

      case 'pin':
        const pinX = (comment.position_x! / 100) * canvasDimensions.width;
        const pinY = (comment.position_y! / 100) * canvasDimensions.height;
        return (
          <Circle
            key={key}
            x={pinX}
            y={pinY}
            radius={8}
            fill={comment.annotation_color || '#FF6B6B'}
            stroke="white"
            strokeWidth={2}
          />
        );

      default:
        return null;
    }
  };

  if (!mockupImage) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading mockup...</p>
      </div>
    );
  }

  return (
    <div id="canvas-container" className="flex items-center justify-center h-full w-full p-8 relative">
      <Stage
        ref={stageRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
      >
        {/* Background Layer - Mockup Image */}
        <Layer>
          <KonvaImage
            image={mockupImage}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
          />
        </Layer>

        {/* Annotation Layer - Saved Annotations */}
        <Layer name="annotation-layer">
          {comments.map(comment => renderAnnotation(comment))}
        </Layer>

        {/* Active Drawing Layer */}
        <Layer>
          {currentShape && (
            <>
              {currentShape.type === 'arrow' && (
                <Arrow {...currentShape} />
              )}
              {currentShape.type === 'circle' && (
                <Circle {...currentShape} fill="transparent" />
              )}
              {currentShape.type === 'rect' && (
                <Rect {...currentShape} fill="transparent" />
              )}
              {currentShape.type === 'freehand' && (
                <Line
                  {...currentShape}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </>
          )}
        </Layer>
      </Stage>

      {/* Comment Dialog */}
      {showCommentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add Comment</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter your comment..."
              className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCommentDialog(false);
                  setCommentText('');
                  setCurrentShape(null);
                  setPendingAnnotationData(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
