import { Award } from 'lucide-react';
import ComingSoon from '@/components/ComingSoon';

export default function CertificatesPage() {
  return (
    <ComingSoon
      title="Approval Certificates"
      description="Access and download official approval certificates for compliance and record-keeping. Each certificate includes the complete approval chain, digital signatures, and audit trail in PDF format."
      icon={<Award className="h-8 w-8 text-[#374151]" />}
    />
  );
}
