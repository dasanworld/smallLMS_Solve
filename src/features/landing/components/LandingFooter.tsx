'use client';

import Link from 'next/link';

export const LandingFooter = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-white mb-4">SmartLMS</h3>
            <p>학습과 교육을 위한 완벽한 솔루션</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">리소스</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white">문서</Link></li>
              <li><Link href="#" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">법률</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white">이용약관</Link></li>
              <li><Link href="#" className="hover:text-white">개인정보처리방침</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center">
          <p>&copy; 2024 SmartLMS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
