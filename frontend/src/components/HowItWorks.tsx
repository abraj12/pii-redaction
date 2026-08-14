export default function HowItWorks() {
  const steps = [
    { title: 'Upload Document', desc: 'Upload your file in supported format' },
    { title: 'Detect PII', desc: 'Our system detects various PII types' },
    { title: 'Redact & Replace', desc: 'PII is replaced with fake data' },
    { title: 'Download', desc: 'Download the redacted document' }
  ];

  return (
    <div className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-8 h-full flex flex-col">
      <h3 className="text-lg font-bold text-[#11133A] mb-8">How it works</h3>
      
      <div className="relative flex-1">
        {/* Connecting line */}
        <div className="absolute left-[15px] top-[24px] bottom-[24px] w-[2px] bg-gray-100"></div>
        
        <div className="space-y-8 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4 items-start relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#5B2BE0] flex items-center justify-center shrink-0 border-4 border-white shadow-sm ring-1 ring-gray-100">
                <span className="text-white text-xs font-bold">{idx + 1}</span>
              </div>
              <div className="pt-1.5">
                <h4 className="text-sm font-bold text-[#11133A]">{step.title}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-[200px]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
