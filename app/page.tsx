import DashboardLayoutAuth from './dashboard-layout-auth';
import Link from 'next/link';
import { Palette, MessageSquare, CheckCircle, ArrowRight, Search, Library, Layers, FileCheck, Clock, Award } from 'lucide-react';

export default function Home() {
  return (
    <DashboardLayoutAuth>
      <div className="max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Approval Orbit</h2>
          <p className="text-gray-600">
            Your collaborative platform for creating, reviewing, and approving visual assets.
          </p>
        </div>

        {/* Main Business Areas - Three Large Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Asset Creation Card */}
          <Link href="/card-designer" className="group">
            <div className="bg-gradient-to-br from-[#374151] to-[#1f2937] rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between mb-6">
                <Palette className="h-12 w-12 text-white" />
                <ArrowRight className="h-6 w-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Asset Creation
              </h3>
              <p className="text-white/80 mb-6 text-sm leading-relaxed">
                Design prepaid cards, checks, and email templates with our intuitive drag-and-drop tools. Search logos, upload assets, and create professional mockups.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-white/70 text-sm">
                  <Search className="h-4 w-4 mr-2" />
                  Logo Search & Library
                </div>
                <div className="flex items-center text-white/70 text-sm">
                  <Palette className="h-4 w-4 mr-2" />
                  Asset Designer
                </div>
                <div className="flex items-center text-white/70 text-sm">
                  <Layers className="h-4 w-4 mr-2" />
                  Template Management
                </div>
              </div>
            </div>
          </Link>

          {/* Markup & Collaboration Card */}
          <Link href="/reviews" className="group">
            <div className="bg-gradient-to-br from-[#374151] to-[#1f2937] rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between mb-6">
                <MessageSquare className="h-12 w-12 text-white" />
                <ArrowRight className="h-6 w-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Markup & Collaboration
              </h3>
              <p className="text-white/80 mb-6 text-sm leading-relaxed">
                Collect client feedback with powerful annotation tools. Add comments, draw arrows, and track version history—all in real-time.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-white/70 text-sm">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Review Dashboard
                </div>
                <div className="flex items-center text-white/70 text-sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Annotation Tools
                </div>
                <div className="flex items-center text-white/70 text-sm">
                  <Library className="h-4 w-4 mr-2" />
                  Version Control
                </div>
              </div>
            </div>
          </Link>

          {/* Approval Management Card */}
          <Link href="/approvals" className="group">
            <div className="bg-gradient-to-br from-[#374151] to-[#1f2937] rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between mb-6">
                <CheckCircle className="h-12 w-12 text-white" />
                <ArrowRight className="h-6 w-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Approval Management
              </h3>
              <p className="text-white/80 mb-6 text-sm leading-relaxed">
                Streamline sequential approval workflows with digital signatures, audit trails, and automatic certificate generation for compliance.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-white/70 text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Pending Approvals
                </div>
                <div className="flex items-center text-white/70 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Workflow Manager
                </div>
                <div className="flex items-center text-white/70 text-sm">
                  <Award className="h-4 w-4 mr-2" />
                  Certificates & Audit
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/search" className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <Search className="h-8 w-8 text-[#374151] mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Logo Search</span>
            </Link>
            <Link href="/card-designer" className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <Palette className="h-8 w-8 text-[#374151] mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Asset Designer</span>
            </Link>
            <Link href="/reviews" className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <FileCheck className="h-8 w-8 text-[#374151] mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Start Review</span>
            </Link>
            <Link href="/approvals" className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group">
              <Clock className="h-8 w-8 text-[#374151] mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">View Approvals</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayoutAuth>
  );
}