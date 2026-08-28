import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Eye, CheckCircle, ArrowUpRight } from 'lucide-react';

function Blockchain() {
    const navigate = useNavigate();

    const features = [
        {
            title: 'My Transactions',
            description: 'View and search all recorded blockchain transactions with cryptographic hashes',
            icon: Eye,
            iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
            path: '/blockchain/my-transactions',
            actionText: 'View Transactions'
        },
        {
            title: 'Verify Transaction',
            description: 'Cryptographically verify an educational document or transaction on the ledger',
            icon: CheckCircle,
            iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
            path: '/blockchain/verify',
            actionText: 'Verify Document'
        }
    ];

    return (
        <Layout>
            <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">
                
                {/* Feature Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                onClick={() => navigate(feature.path)}
                                className="bg-white rounded-[22px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform`}>
                                            <Icon size={22} />
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#2c3543] text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                                            <ArrowUpRight size={15} />
                                        </div>
                                    </div>
                                    <h2 className="text-[17px] font-black text-slate-900 tracking-tight mb-1">{feature.title}</h2>
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">{feature.description}</p>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(feature.path);
                                    }}
                                    className="w-full bg-[#2c3543] hover:bg-[#1f2631] text-white py-2 px-4 rounded-full text-xs font-bold border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>{feature.actionText}</span>
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Info Section */}
                <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 p-6">
                    <h3 className="text-[16px] font-black text-slate-900 tracking-tight mb-4">About Blockchain Verification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
                        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                                <i className="fa-solid fa-shield-halved text-blue-600"></i>
                                <span>Why Use Blockchain?</span>
                            </h4>
                            <p className="leading-relaxed">Blockchain technology ensures immutable and transparent verification of educational documents, providing tamper-proof records of student credentials.</p>
                        </div>
                        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                                <i className="fa-solid fa-cube text-purple-600"></i>
                                <span>How It Works</span>
                            </h4>
                            <p className="leading-relaxed">Every transaction is recorded on a decentralized distributed ledger, creating a permanent verification record that can be validated instantly without third-party delay.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Blockchain;
