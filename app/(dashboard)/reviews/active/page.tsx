import { MessageSquare } from 'lucide-react';
import ComingSoon from '@/components/ComingSoon';

export default function ActiveReviewsPage() {
  return (
    <ComingSoon
      title="Active Reviews"
      description="View and manage assets currently under review. Collaborate with clients using powerful annotation tools including comments, arrows, shapes, and freehand drawing. Real-time updates keep everyone in sync."
      icon={<MessageSquare className="h-8 w-8 text-[#374151]" />}
    />
  );
}
