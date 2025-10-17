import { CheckCircle } from 'lucide-react';
import ComingSoon from '@/components/ComingSoon';

export default function ApprovalWorkflowsPage() {
  return (
    <ComingSoon
      title="Approval Workflows"
      description="Configure and manage sequential approval workflows for your organization. Define stages, assign roles, and create custom approval chains for different asset types (cards, checks, emails)."
      icon={<CheckCircle className="h-8 w-8 text-[#374151]" />}
    />
  );
}
