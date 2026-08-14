import { Eye, User, Mail, Phone, Building2, MapPin, CreditCard, ShieldCheck, Calendar, Globe } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  CreditCard,
  ShieldCheck,
  Calendar,
  Globe
};

interface PIICategoriesProps {
  documents?: any[];
}

const CATEGORY_MAP: Record<string, { label: string, iconName: string }> = {
  'PERSON': { label: 'Names', iconName: 'User' },
  'EMAIL_ADDRESS': { label: 'Emails', iconName: 'Mail' },
  'PHONE_NUMBER': { label: 'Phones', iconName: 'Phone' },
  'ORGANIZATION': { label: 'Organizations', iconName: 'Building2' },
  'LOCATION': { label: 'Locations', iconName: 'MapPin' },
  'CREDIT_CARD': { label: 'Credit Cards', iconName: 'CreditCard' },
  'US_SSN': { label: 'SSNs', iconName: 'ShieldCheck' },
  'DATE_TIME': { label: 'Dates', iconName: 'Calendar' },
  'URL': { label: 'Links/URLs', iconName: 'Globe' },
};

export default function PIICategories({ documents = [] }: PIICategoriesProps) {
  // Aggregate PII breakdown across all documents
  const aggregatedStats: Record<string, number> = {
    'PERSON': 0,
    'EMAIL_ADDRESS': 0,
    'PHONE_NUMBER': 0,
    'ORGANIZATION': 0,
    'LOCATION': 0,
    'CREDIT_CARD': 0,
    'US_SSN': 0,
    'DATE_TIME': 0,
    'URL': 0
  };

  documents.forEach(doc => {
    if (doc.piiBreakdown) {
      Object.keys(doc.piiBreakdown).forEach(key => {
        if (aggregatedStats[key] !== undefined) {
          aggregatedStats[key] += doc.piiBreakdown[key];
        }
      });
    }
  });

  const categories = Object.keys(aggregatedStats).map(key => ({
    id: key,
    label: CATEGORY_MAP[key].label,
    iconName: CATEGORY_MAP[key].iconName,
    count: aggregatedStats[key]
  }));

  return (
    <div className="mt-8">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-lg font-bold text-[#11133A]">PII Categories Detected</h3>
        <button className="flex items-center gap-2 text-sm font-medium text-[#5B2BE0] hover:text-[#4f24c7] transition-colors">
          <Eye className="w-4 h-4" />
          View Details
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {categories.map((category) => {
          const Icon = iconMap[category.iconName];
          return (
            <div 
              key={category.id} 
              className="bg-white rounded-[12px] p-4 border border-gray-100 shadow-sm flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-[#5B2BE0]/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-[#5B2BE0]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#11133A] leading-none mb-1">
                  {category.count.toString().padStart(2, '0')}
                </p>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  {category.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
