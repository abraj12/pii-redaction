export default function Terms() {
  return (
    <div className="max-w-[800px] mx-auto py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-[#11133A] mb-6">Terms of Service</h1>
        
        <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the PII Redaction Tool, you accept and agree to be bound by the terms and provisions of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Accuracy of Redaction</h2>
            <p>
              While our system utilizes state-of-the-art NLP engines to detect Personally Identifiable Information (PII), it is provided "as is". 
              <strong> You agree that you are solely responsible for verifying the final output. </strong> We do not guarantee 100% detection accuracy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Acceptable Use</h2>
            <p>
              You agree not to use the service to upload malicious files, attempt to reverse engineer the redaction pipeline, or bypass security limitations. 
              Maximum file size restrictions must be respected.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
