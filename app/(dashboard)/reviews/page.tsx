import { FileCheck } from 'lucide-react';
import ComingSoon from '@/components/ComingSoon';

export default function ReviewDashboardPage() {
  return (
    <ComingSoon
      title="Review Dashboard"
      description="Central hub for managing all asset reviews. View active review sessions, track feedback progress, and monitor annotation activity across your organization's visual assets."
      icon={<FileCheck className="h-8 w-8 text-[#374151]" />}
    />
  );
}
