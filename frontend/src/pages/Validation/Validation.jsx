import React, { useState, useEffect } from 'react';
import { CheckCircle, ExternalLink, ShieldCheck, AlertTriangle, Mail, Phone, Globe, Loader2 } from 'lucide-react';
import ValidationNavbar from '../../components/ValidationPageNavBar';
import Footer from '../../components/Footer';

const Validation = () => {
  // STATE MANAGEMENT
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false); // Toggle to 'true' to test the green success view

  // MOCK DATA
  const data = {
    student: {
      requestId: "REQ1234-2026",
      name: "Juan Dela Cruz",
      studentId: "2023-102347",
      program: "BS Information Technology",
    },
    blockchain: {
      docType: "Transcript of Records",
      institution: "University",
      dateIssued: "January 30, 2026",
      hash: "028372473",
      status: "Recorded",
      txId: "0x523427a65",
      recordedDate: "January 28, 2026",
    }
  };

  // SIMULATE BLOCKCHAIN FETCH
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2-second delay to simulate blockchain querying
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col">
      <ValidationNavbar />

      <main className="max-w-6xl mx-auto p-6 lg:p-12 flex-grow w-full">
        
        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
            <Loader2 className="w-16 h-16 text-[#3d5a73] animate-spin" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-700">Verifying Document</h2>
              <p className="text-gray-500 mt-2 animate-pulse tracking-wide uppercase text-xs font-bold">
                Querying VerifiTOR Blockchain Ledger...
              </p>
            </div>
          </div>
        ) : (
          <>
            {isValid ? (
              /* VALID / AUTHENTIC VIEW */
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-[#2ecc71] text-white rounded-2xl p-10 mb-10 text-center shadow-lg shadow-green-100">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-3">Status: Verified and Authentic</h1>
                  <p className="text-lg opacity-90 font-light">This Transcript is authentic and has been successfully verified on the blockchain</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Student Card */}
                  <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-bold text-gray-700">Student Information</h2>
                      <span className="flex items-center bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-sm font-semibold border border-green-100">
                        <CheckCircle className="w-4 h-4 mr-2" /> Verified
                      </span>
                    </div>
                    <div className="space-y-5">
                      {[
                        ["Request ID", data.student.requestId],
                        ["Name", data.student.name],
                        ["Student ID", data.student.studentId],
                        ["Program", data.student.program]
                      ].map(([label, value]) => (
                        <div key={label} className="flex border-b border-gray-50 pb-3">
                          <span className="w-1/3 text-gray-500 font-medium">{label}:</span>
                          <span className="w-2/3 text-gray-900 font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Blockchain Card */}
                  <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-bold text-gray-700 mb-8 flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2 text-[#34495e]" />
                      Document & Blockchain Integrity
                    </h2>
                    <div className="space-y-5">
                      <div className="flex border-b border-gray-50 pb-3">
                        <span className="w-1/3 text-gray-500 font-medium">Document Type:</span>
                        <span className="w-2/3 text-gray-900 font-semibold">{data.blockchain.docType}</span>
                      </div>
                      <div className="flex border-b border-gray-50 pb-3">
                        <span className="w-1/3 text-gray-500 font-medium">Issuing Institution:</span>
                        <span className="w-2/3 text-gray-900 font-semibold">{data.blockchain.institution}</span>
                      </div>
                      <div className="flex border-b border-gray-50 pb-3">
                        <span className="w-1/3 text-gray-500 font-medium">Date Issued:</span>
                        <span className="w-2/3 text-gray-900 font-semibold">{data.blockchain.dateIssued}</span>
                      </div>
                      
                      <div className="pt-6 mt-6 border-t-2 border-dashed border-gray-100 space-y-4 bg-slate-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-tight">Hash Value:</span>
                          <span className="text-gray-800 font-mono font-bold bg-white px-2 py-1 rounded border border-gray-200">{data.blockchain.hash}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-tight">Blockchain Status:</span>
                          <span className="text-blue-600 font-bold italic flex items-center uppercase text-xs">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
                            {data.blockchain.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-tight">Transaction ID:</span>
                          <div className="flex items-center text-gray-700 hover:text-blue-600 cursor-pointer transition-colors">
                            <span className="font-mono text-xs mr-1">{data.blockchain.txId}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Timestamp:</span>
                          <span className="text-[10px] text-gray-500 font-medium uppercase">{data.blockchain.recordedDate}</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              /* INVALID / TAMPERED VIEW */
              <div className="animate-in zoom-in-95 duration-500 max-w-4xl mx-auto">
                {/* Status Banner (Red) */}
                <div className="bg-[#c0392b] text-white rounded-2xl p-10 mb-10 text-center shadow-lg shadow-red-100">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-3 uppercase tracking-tight">Status: Invalid / Not Found / Tampered</h1>
                  <p className="text-lg opacity-90 font-light">This transcript of record is invalid, has been altered, or does not exist in our records</p>
                </div>

                {/* Warning Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 mb-8 flex items-start space-x-8">
                  <div className="bg-red-50 p-5 rounded-full flex-shrink-0">
                    <AlertTriangle className="w-12 h-12 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Verification Failed</h2>
                    <p className="text-gray-600 leading-relaxed text-lg font-light">
                      The document's digital signature does not match the blockchain records secured by VerifiTOR. 
                      Please contact the university registrar immediately for further assistance.
                    </p>
                  </div>
                </div>

                {/* Contact Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10">
                  <h2 className="text-xl font-bold text-gray-800 mb-8 border-b border-gray-100 pb-4">Contact Registrar Office</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                      <div className="flex items-center text-gray-400 mb-2 uppercase text-[10px] font-black tracking-widest">
                        <Mail className="w-4 h-4 mr-2" /> Email Address
                      </div>
                      <a href="mailto:registrar@university.edu.ph" className="text-blue-600 font-semibold hover:underline">registrar@university.edu.ph</a>
                    </div>
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                      <div className="flex items-center text-gray-400 mb-2 uppercase text-[10px] font-black tracking-widest">
                        <Phone className="w-4 h-4 mr-2" /> Phone Number
                      </div>
                      <span className="text-gray-800 font-semibold">(02) 1234-5678</span>
                    </div>
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                      <div className="flex items-center text-gray-400 mb-2 uppercase text-[10px] font-black tracking-widest">
                        <Globe className="w-4 h-4 mr-2" /> Official Website
                      </div>
                      <a href="https://university.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">University.com</a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Validation;