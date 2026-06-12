import React from 'react';
import { Search, Smartphone, Calendar, Music, Upload } from 'lucide-react';
import { ViewState } from '../types';

interface LandingViewProps {
  onNavigate: (view: ViewState) => void;
}

export default function LandingView({ onNavigate }: LandingViewProps) {
  return (
    <>
      {/* 1. Hero Section */}
      <section className="pt-32 pb-24 px-6 text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8 break-keep">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-900">
            주님께 드리는 찬양에만<br />집중하세요.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 mb-12 max-w-2xl mx-auto leading-relaxed break-keep">
          매주 바뀌는 콘티, 찾기 힘들었던 지난 악보들.<br className="hidden md:block" />
          이제 스마트폰과 태블릿 하나로<br className="block md:hidden" /> 
          언제 어디서나 일곡교회 찬양팀의 모든 악보를<br className="block md:hidden" />
          한눈에 확인하고 연주할 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => onNavigate('setlist')}
            className="px-8 py-4 bg-zinc-900 text-white rounded-full font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <Calendar size={18} />
            주간 콘티 바로가기
          </button>
          <button 
            onClick={() => onNavigate('search')}
            className="px-8 py-4 bg-white text-zinc-900 border border-zinc-200 rounded-full font-semibold hover:border-zinc-900 transition-all flex items-center justify-center gap-2"
          >
            <Search size={18} />
            전체 악보 검색하기
          </button>
          <button 
            onClick={() => onNavigate('upload')}
            className="px-8 py-4 bg-zinc-100 text-zinc-900 rounded-full font-semibold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            악보 업로드
          </button>
        </div>
      </section>

      {/* 2. Story & Empathy Section */}
      <section className="py-24 bg-zinc-50 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 break-keep">
            건반 앞에서 보낸 10년,<br />우리가 진짜 필요한 것을 고민했습니다.
          </h2>
          <p className="text-lg text-zinc-600 leading-relaxed break-keep">
            예배를 준비하며 악보를 복사하고, 순서대로 정리하고, <br className="block md:hidden" />가끔 잃어버려 당황했던 적 있으신가요?<br />
            AUX 연주자로 10년간 섬기며 느꼈던 작은 불편함들을 모아,<br className="hidden md:block" />
            우리 찬양팀만을 위한 가장 쉽고 빠른 악보 리스트를 만들었습니다.<br />
            복잡한 설치나 가입 없이, 접속만 하면 바로 연주 준비 끝입니다.
          </p>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold break-keep">오직 찬양팀을 위한 스마트한 악보장</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl border border-zinc-100 hover:shadow-xl hover:border-transparent transition-all bg-white flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
              <Music className="text-zinc-900" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-4 break-keep">1초 만에 찾는 빠른 검색<br />코드별 분류</h3>
            <p className="text-zinc-600 leading-relaxed break-keep">
              제목이나 주제어 검색은 기본! A코드, G코드 등 코드별로 악보가 깔끔하게 분류되어 있어, <br className="block md:hidden" />콘티의 흐름을 짜거나 이어지는 찬양을 찾을 때 훨씬 수월합니다.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-zinc-100 hover:shadow-xl hover:border-transparent transition-all bg-white flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
              <Smartphone className="text-zinc-900" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-4 break-keep">기기 제약 없는 깔끔한 뷰어</h3>
            <p className="text-zinc-600 leading-relaxed break-keep">
              휴대폰, 태블릿, PC 어디서든 깨지지 않는 선명한 이미지 화질. <br className="block md:hidden" />화면 넘김도 부드러워 실제 연주 중에도 전혀 불편함이 없습니다.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-zinc-100 hover:shadow-xl hover:border-transparent transition-all bg-white flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
              <Calendar className="text-zinc-900" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-4 break-keep">주간 콘티<br />모아보기</h3>
            <p className="text-zinc-600 leading-relaxed break-keep">
              이번 주 주일 예배, 금요 철야 예배 콘티가 폴더별로 깔끔하게 정리되어 있어 <br className="block md:hidden" />여러 곳을 헤맬 필요 없이 바로 예배를 준비할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Target & Vision Section */}
      <section className="py-32 bg-zinc-900 text-white px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight break-keep">
            "호흡이 있는 자마다<br />여호와를 찬양할지어다 할렐루야"
          </h2>
          <p className="text-zinc-400 mb-6 font-medium">(시편 150:6)</p>
          <p className="text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto break-keep">
            오랜 시간 합을 맞춰온 기존 팀원들에게는 더 가볍고 쾌적한 연습 환경을, <br className="block md:hidden" />새로 합류할 미래의 찬양팀원들에게는 일곡교회의 찬양 리스트를 가장 쉽게 파악할 수 있는 든든한 가이드가 되어줍니다.<br /><br />
            악보 찾기에 쏟는 시간을 줄이고, <br className="block md:hidden" />온전히 마음을 다해 예배를 준비하는 시간을 늘려보세요.
          </p>
        </div>
      </section>

      {/* 5. Footer & Call to Action */}
      <footer className="py-16 text-center border-t border-zinc-100 px-6">
        <h2 className="text-2xl font-bold mb-6 break-keep">준비된 찬양, 스마트한 시작.<br className="block md:hidden" /> 지금 바로 접속해 보세요.</h2>
        <div className="inline-block bg-zinc-50 rounded-lg px-6 py-3 mb-12 text-sm text-zinc-600 border border-zinc-100 break-keep">
          💡 <strong>Tip:</strong> 지금 이 페이지를 '홈 화면에 추가'해 두시면 <br className="block md:hidden" />앱처럼 더욱 빠르게 접속할 수 있습니다.
        </div>
        
        <div className="text-zinc-400 text-sm break-keep">
          <p className="mb-2">ⓒ 2026 일곡교회 찬양팀. All rights reserved.</p>
          <p>문의 및 악보 추가 요청: <a href="mailto:contact@ilgok-worship.com" className="underline hover:text-zinc-900 transition-colors">contact@ilgok-worship.com</a></p>
        </div>
      </footer>
    </>
  );
}
