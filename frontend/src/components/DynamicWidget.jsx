import React from 'react';
import { Link } from 'react-router-dom';
import CustomButton from './common/CustomButton';

const BannerWidget = ({ data }) => (
    <div className="relative w-full h-[400px] mb-12 rounded-3xl overflow-hidden shadow-2xl group">
        <img 
            src={data.content?.image_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=2070'} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            alt={data.title}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-12">
            <div className="max-w-xl animate-fade-in">
                <h2 className="text-4xl font-black text-white mb-4">{data.title}</h2>
                <p className="text-lg text-slate-200 mb-8">{data.content?.description}</p>
                {data.content?.link && (
                    <Link to={data.content.link}>
                        <CustomButton variant="primary" size="lg">
                            {data.content?.button_text || 'Shop Now'}
                        </CustomButton>
                    </Link>
                )}
            </div>
        </div>
    </div>
);

const FlashSaleWidget = ({ data }) => (
    <div className="bg-indigo-600 rounded-3xl p-8 mb-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-indigo-200">
        <div>
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                🔥 Flash Sale
            </div>
            <h2 className="text-3xl font-black mb-2">{data.title}</h2>
            <p className="text-indigo-100">{data.content?.description}</p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="text-center">
                <div className="text-4xl font-black">{data.content?.discount || '50%'}</div>
                <div className="text-xs uppercase font-bold text-indigo-300">Off</div>
            </div>
            <Link to={data.content?.link || '/products'}>
                <button className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-lg">
                    Grab Deal
                </button>
            </Link>
        </div>
    </div>
);

export default function DynamicWidget({ widget }) {
    if (!widget || !widget.is_active) return null;

    switch (widget.type) {
        case 'banner':
            return <BannerWidget data={widget} />;
        case 'flash_sale':
            return <FlashSaleWidget data={widget} />;
        default:
            return null;
    }
}
