import { Construction } from 'lucide-react'

interface ComingSoonProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          {icon || <Construction className="h-8 w-8 text-blue-600" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          {description || 'This feature is being built and will be available soon. Check back later!'}
        </p>
      </div>
    </div>
  )
}