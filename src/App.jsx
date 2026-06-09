import { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, Menu, X, ChevronRight, LogOut, Trash2, Plus, Loader2 } from 'lucide-react';

// ==========================================
// CONFIGURATION (구글 앱스 스크립트 연결 주소)
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbyDmiXNxUIGrJ4UL8Cpb7kWQJdQmYodwbBdw6a024u4_85YueYu7TDevcOjelwTUlOz/exec"; 

// --- 속성별 색상 매핑 ---
const ATTR_COLORS = {
  '불': 'text-red-500', '빨강': 'text-red-500', '꼬비': 'text-red-500', '루치': 'text-red-500', '토리': 'text-red-500', '불범': 'text-red-500',
  '물': 'text-blue-500', '파랑': 'text-blue-500', '갑징이': 'text-blue-500', '로기영감': 'text-blue-500', '아르미': 'text-blue-500',
  '나무': 'text-green-500', '초록': 'text-green-500', '피요': 'text-green-500', '짜잔군': 'text-green-500', '래토': 'text-green-500', '아치': 'text-green-500', '양파쿵야': 'text-green-500',
  '어둠': 'text-purple-500', '보라': 'text-purple-500', '도키': 'text-purple-500', '보라쿤': 'text-purple-500', '쿠로미': 'text-purple-500',
  '빛': 'text-amber-500 dark:text-yellow-400', '황금': 'text-amber-500 dark:text-yellow-400', '졸리': 'text-amber-500 dark:text-yellow-400', '폼폼': 'text-amber-500 dark:text-yellow-400', '마멜': 'text-amber-500 dark:text-yellow-400',
};

// 속성 기반 텍스트 색상 클래스 추출 함수
const getColorClass = (text) => {
  if (!text) return '';
  for (let key in ATTR_COLORS) {
    if (text.includes(key)) return ATTR_COLORS[key];
  }
  return '';
};

// ==========================================
// UTILITIES (보안)
// ==========================================
// SHA-256 비밀번호 단방향 암호화
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// GLOBAL MOCK DATA (API 연결 전 테스트용)
// ==========================================
const MOCK_USERS = {
  '관리자': { pwdHash: '', role: 'ADMIN', job: '로그' },
  '길드장': { pwdHash: '', role: 'MASTER', job: '소드맨' }
};

const MOCK_METADATA = [
  { category: 'job', item_name: '소드맨', attribute: '0', basic: 1 },
  { category: 'familiar', item_name: '불범(불)', attribute: '불', basic: 1 },
  { category: 'familiar', item_name: '피요(나무)', attribute: '나무', basic: 1 },
  { category: 'familiar', item_name: '해룡(물)', attribute: '물', basic: 0 },
  { category: 'skill_passive', item_name: '분포', attribute: '0', basic: 1 },
  { category: 'skill_active', item_name: '메테오(불)', attribute: '불', basic: 0 },
  { category: 'score_type', item_name: '허수아비', attribute: '0', basic: 0 },
  { category: 'score_type', item_name: '차원의 경계', attribute: '0', basic: 0 },
];

const MOCK_LOGS = [
  { timestamp: '2026-06-01', username: '길드장', item: '전투력', value: '4000000' },
  { timestamp: '2026-06-09', username: '길드장', item: '전투력', value: '5000000' },
  { timestamp: '2026-06-09', username: '길드장', item: '허수아비', value: '1500000' },
];

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState(null); 
  const [page, setPage] = useState('sign'); 
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 글로벌 로딩 상태

  // 데이터 상태
  const [metadata] = useState(MOCK_METADATA);
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [decks, setDecks] = useState([]);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  const toggleDark = () => setDark(!dark);
  const goPage = (p) => { setPage(p); setMenuOpen(false); };
  const logout = () => { setUser(null); setPage('sign'); setMenuOpen(false); };

  // 실전형 API 호출 함수 (실제 연결 시 Fetch 사용, 미설정 시 Mock 동작)
  const apiCall = async (action, payload = {}) => {
    setIsLoading(true);
    
    // API_URL 이 실제 설정되어 있는 경우 비동기 통신 구동
    if (API_URL && !API_URL.includes("YOUR_SCRIPT_ID")) {
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({ action, ...payload })
        });
        const result = await res.json();
        setIsLoading(false);
        return result;
      } catch (error) {
        console.error("API Error:", error);
        setIsLoading(false);
        return { success: false, msg: 'API 통신 오류가 발생했습니다.' };
      }
    }

    // --- MOCK DELAY (1초) 성능 시뮬레이션 ---
    await new Promise(r => setTimeout(r, 800));
    
    let result = { success: true };
    if (action === 'auth') {
      const u = MOCK_USERS[payload.username];
      if (!u) result = { success: false, msg: '화이트리스트에 없습니다.' };
      else result = { success: true, role: u.role, job: u.job };
    }
    else if (action === 'add_log') {
      const newLog = { 
        timestamp: new Date().toISOString().split('T')[0], 
        username: payload.username, 
        item: payload.item, 
        value: payload.value 
      };
      setLogs(prev => [...prev, newLog]);
    }
    else if (action === 'save_deck') {
      setDecks(prev => {
        const exists = prev.some(d => d.id === payload.deck.id);
        if (exists) return prev.map(d => d.id === payload.deck.id ? payload.deck : d);
        return [...prev, payload.deck];
      });
    }
    else if (action === 'delete_deck') {
      setDecks(prev => prev.filter(d => d.id !== payload.deckId));
    }
    
    setIsLoading(false);
    return result;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        
        {/* 글로벌 로딩 오버레이 */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm">
            <Loader2 className="animate-spin text-black dark:text-white" size={48} />
          </div>
        )}

        <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
          <div className="text-xl font-bold tracking-widest uppercase cursor-pointer" onClick={() => user && goPage('kingdom')}>
            GUILD_NAME
          </div>
          <div className="flex items-center gap-6">
            <button onClick={toggleDark} className="hover:opacity-60 transition-opacity">
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user && (
              <button className="md:hidden hover:opacity-60" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
            {user && (
              <div className="hidden md:flex items-center gap-8 text-sm tracking-wide">
                <button onClick={() => goPage('kingdom')} className={`hover:opacity-60 ${page === 'kingdom' ? 'font-bold' : ''}`}>킹덤</button>
                <button onClick={() => goPage('personal')} className={`hover:opacity-60 ${page === 'personal' ? 'font-bold' : ''}`}>개인 공간</button>
                {['MASTER', 'ELITE', 'ADMIN'].includes(user.role) && (
                  <button onClick={() => goPage('manage')} className={`hover:opacity-60 ${page === 'manage' ? 'font-bold' : ''}`}>관리</button>
                )}
                <button onClick={logout} className="hover:opacity-60 flex items-center gap-2"><LogOut size={16} /> 종료</button>
              </div>
            )}
          </div>
        </nav>

        {menuOpen && user && (
          <div className="md:hidden flex flex-col p-6 gap-6 text-lg max-w-7xl mx-auto">
            <button onClick={() => goPage('kingdom')} className="text-left hover:opacity-60">킹덤</button>
            <button onClick={() => goPage('personal')} className="text-left hover:opacity-60">개인 공간</button>
            {['MASTER', 'ELITE', 'ADMIN'].includes(user.role) && <button onClick={() => goPage('manage')} className="text-left hover:opacity-60">관리</button>}
            <button onClick={logout} className="text-left hover:opacity-60 text-red-500">종료</button>
          </div>
        )}

        <main className="p-6 max-w-7xl mx-auto mt-4 pb-20 relative">
          {!user ? (
            <SignPage setPage={goPage} setUser={setUser} apiCall={apiCall} />
          ) : (
            <>
              {page === 'kingdom' && <KingdomPage logs={logs} metadata={metadata} />}
              {page === 'personal' && (
                <PersonalPage 
                  user={user} 
                  logs={logs} 
                  metadata={metadata} 
                  decks={decks} 
                  setDecks={setDecks}
                  apiCall={apiCall} 
                />
              )}
              {page === 'manage' && <ManagePage user={user} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ==========================================
// 1. SIGN PAGE 
// ==========================================
function SignPage({ setPage, setUser, apiCall }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    
    const hashedPwd = await hashPassword(pwd);
    
    // API Call
    const res = await apiCall('auth', { username: name, password: hashedPwd, isLogin });
    
    if (res.success) {
      if (isLogin) {
        setUser({ name, role: res.role, job: res.job });
        setPage('personal'); // 바로 개인 공간으로 전환
      } else {
        setMsg(res.msg || '가입 완료. 로그인해주세요.');
        setIsLogin(true);
        setPwd('');
      }
    } else {
      setMsg(res.msg);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 animate-fade-in">
      <h1 className="text-3xl font-light mb-12 tracking-widest uppercase">{isLogin ? '로그인' : '회원가입'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <input type="text" placeholder="닉네임" value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none" required />
        <input type="password" placeholder="비밀번호" value={pwd} onChange={e => setPwd(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none" required />
        {msg && <div className="text-sm opacity-60 text-red-500">{msg}</div>}
        <div className="flex justify-between items-center mt-4">
          <button type="button" onClick={() => {setIsLogin(!isLogin); setMsg('');}} className="text-sm opacity-60 hover:opacity-100 tracking-wider">
            {isLogin ? '계정 만들기' : '로그인으로 돌아가기'}
          </button>
          <button type="submit" className="tracking-widest flex items-center gap-2 hover:opacity-60">
            {isLogin ? '입장' : '가입'} <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// 2. KINGDOM PAGE (로그 기반 최신 데이터 추출 뷰)
// ==========================================
function KingdomPage({ logs, metadata }) {
  // 로그에서 각 유저별, 항목별 최신 값 추출
  const latestData = useMemo(() => {
    const dataMap = {};
    const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sortedLogs.forEach(log => {
      if (!dataMap[log.username]) dataMap[log.username] = { name: log.username };
      dataMap[log.username][log.item] = log.value;
    });
    return Object.values(dataMap);
  }, [logs]);

  const reqFamiliars = metadata.filter(m => m.category === 'familiar' && m.basic === 1).map(m => m.item_name);
  const reqSkills = metadata.filter(m => m.category === 'skill_passive' && m.basic === 1).map(m => m.item_name);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-light tracking-widest mb-12">킹덤 멤버 현황</h2>
      <div className="overflow-x-auto pb-8">
        <table className="w-full text-sm">
          <thead className="border-b border-black dark:border-white opacity-60">
            <tr>
              <th className="text-left py-4 px-6 font-normal">닉네임</th>
              <th className="text-left py-4 px-6 font-normal">전투력</th>
              {reqFamiliars.map(f => <th key={f} className={`text-left py-4 px-6 font-normal ${getColorClass(f)}`}>{f}</th>)}
              {reqSkills.map(s => <th key={s} className={`text-left py-4 px-6 font-normal ${getColorClass(s)}`}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {latestData.map((row, idx) => (
              <tr key={idx} className="border-b border-transparent hover:border-black dark:hover:border-white hover:border-opacity-10 transition-colors">
                <td className="py-4 px-6 opacity-80">{row.name}</td>
                <td className="py-4 px-6 opacity-80">{Number(row['전투력'] || 0).toLocaleString()}</td>
                {reqFamiliars.map(f => <td key={f} className={`py-4 px-6 opacity-80 ${getColorClass(f)}`}>{row[f] || '-'}</td>)}
                {reqSkills.map(s => <td key={s} className={`py-4 px-6 opacity-80 ${getColorClass(s)}`}>{row[s] || '-'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 3. PERSONAL PAGE
// ==========================================
function PersonalPage({ user, logs, metadata, decks, setDecks, apiCall }) {
  const [tab, setTab] = useState('input'); // input, deck, score, stats

  // 내 기록만 필터링하고 최신 값 추적
  const myLogs = useMemo(() => logs.filter(l => l.username === user.name).sort((a,b) => new Date(a.timestamp)-new Date(b.timestamp)), [logs, user.name]);
  
  const myLatestData = useMemo(() => {
    const data = {};
    myLogs.forEach(l => data[l.item] = l.value);
    return data;
  }, [myLogs]);

  const handleSaveStat = async (item, value) => {
    if (!value) return;
    await apiCall('add_log', { username: user.name, item, value });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-light tracking-widest mb-2">{user.name}의 공간</h2>
      <p className="opacity-40 text-sm mb-12 tracking-widest uppercase">등급: {user.role}</p>

      <div className="flex gap-8 text-sm tracking-widest mb-12 border-b border-black dark:border-white pb-4 overflow-x-auto">
        <button onClick={() => setTab('input')} className={`whitespace-nowrap hover:opacity-60 ${tab === 'input' ? 'font-bold' : 'opacity-40'}`}>데이터 편집</button>
        <button onClick={() => setTab('deck')} className={`whitespace-nowrap hover:opacity-60 ${tab === 'deck' ? 'font-bold' : 'opacity-40'}`}>덱 설정</button>
        <button onClick={() => setTab('score')} className={`whitespace-nowrap hover:opacity-60 ${tab === 'score' ? 'font-bold' : 'opacity-40'}`}>점수</button>
        <button onClick={() => setTab('stats')} className={`whitespace-nowrap hover:opacity-60 ${tab === 'stats' ? 'font-bold' : 'opacity-40'}`}>통계</button>
      </div>

      {tab === 'input' && <TabInput metadata={metadata} myLatestData={myLatestData} onSave={handleSaveStat} />}
      {tab === 'deck' && <TabDeck metadata={metadata} myLatestData={myLatestData} decks={decks} setDecks={setDecks} apiCall={apiCall} user={user} />}
      {tab === 'score' && <TabScore metadata={metadata} myLogs={myLogs} onSave={handleSaveStat} />}
      {tab === 'stats' && <TabStats myLogs={myLogs} />}
    </div>
  );
}

// ==========================================
// 3-1. TAB INPUT (기존 내장 컴포넌트 구조의 독립형 컴포넌트 변환)
// ==========================================
function Table2Col({ title, items, tempData, myLatestData, handleInput, onSave }) {
  return (
    <div className="mb-10 w-full max-w-2xl">
      <h3 className="text-sm tracking-widest font-bold mb-4 opacity-60 border-b border-black dark:border-white pb-2">{title}</h3>
      <table className="w-full text-sm text-left">
        <tbody>
          {items.map(m => {
            const currentVal = myLatestData[m.item_name] || '';
            const typedVal = tempData[m.item_name] !== undefined ? tempData[m.item_name] : currentVal;
            
            return (
              <tr key={m.item_name} className="border-b border-black dark:border-white border-opacity-10 group">
                <th className={`p-4 w-1/3 font-normal align-middle ${getColorClass(m.item_name)}`}>
                  {m.item_name}
                </th>
                <td className="p-4 w-2/3 flex gap-4">
                  <input 
                    type="text" 
                    value={typedVal}
                    onChange={(e) => handleInput(m.item_name, e.target.value)}
                    className="w-full bg-transparent focus:outline-none"
                    placeholder="수치 기입"
                  />
                  {typedVal !== currentVal && (
                    <button onClick={() => onSave(m.item_name, typedVal)} className="text-[10px] opacity-40 hover:opacity-100 whitespace-nowrap border border-black dark:border-white px-2 py-1 uppercase tracking-wider">
                      저장
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TabInput({ metadata, myLatestData, onSave }) {
  const [tempData, setTempData] = useState({});

  const handleInput = (item, val) => setTempData(prev => ({...prev, [item]: val}));

  return (
    <div className="flex flex-col gap-4">
      <Table2Col 
        title="기본 정보" 
        items={[{item_name: '전투력'}]} 
        tempData={tempData}
        myLatestData={myLatestData}
        handleInput={handleInput}
        onSave={onSave}
      />
      <Table2Col 
        title="필수 이마젠" 
        items={metadata.filter(m => m.category === 'familiar' && m.basic === 1)} 
        tempData={tempData}
        myLatestData={myLatestData}
        handleInput={handleInput}
        onSave={onSave}
      />
      <Table2Col 
        title="필수 패시브 스킬" 
        items={metadata.filter(m => m.category === 'skill_passive' && m.basic === 1)} 
        tempData={tempData}
        myLatestData={myLatestData}
        handleInput={handleInput}
        onSave={onSave}
      />
      <Table2Col 
        title="추가 이마젠" 
        items={metadata.filter(m => m.category === 'familiar' && m.basic === 0)} 
        tempData={tempData}
        myLatestData={myLatestData}
        handleInput={handleInput}
        onSave={onSave}
      />
      <Table2Col 
        title="액티브 스킬" 
        items={metadata.filter(m => m.category === 'skill_active')} 
        tempData={tempData}
        myLatestData={myLatestData}
        handleInput={handleInput}
        onSave={onSave}
      />
    </div>
  );
}

// ==========================================
// 3-2. TAB DECK (독립형 구조)
// ==========================================
function DeckSelectGrid({ label, type, options, deckId, currentVals, decks, setDecks, myLatestData }) {
  return (
    <div className="mb-6">
      <span className="opacity-40 text-xs tracking-wider block mb-3">{label}</span>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <select 
            key={i} 
            value={currentVals[i]} 
            onChange={(e) => {
              const newDecks = decks.map(d => d.id === deckId ? { ...d, [type]: d[type].map((v, idx) => idx === i ? e.target.value : v) } : d);
              setDecks(newDecks);
            }}
            className={`w-full bg-transparent border-b border-black dark:border-white py-1 focus:outline-none text-xs appearance-none cursor-pointer truncate ${getColorClass(currentVals[i])}`}
          >
            <option value="" className="text-black">- 슬롯 {i+1} -</option>
            {options.map(opt => (
              <option key={opt.item_name} value={opt.item_name} className="text-black">
                {opt.item_name} {myLatestData[opt.item_name] ? `(${myLatestData[opt.item_name]})` : ''}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}

function TabDeck({ metadata, myLatestData, decks, setDecks, apiCall, user }) {
  const addDeck = () => setDecks([...decks, { id: Date.now(), name: `새 덱 ${decks.length+1}`, f: ['','',''], a: ['','',''], p: ['','',''] }]);
  
  const deleteDeck = async (deckId) => {
    const confirmDelete = window.confirm("이 덱을 삭제하시겠습니까?");
    if (confirmDelete) {
      await apiCall('delete_deck', { deckId });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <p className="opacity-60 text-sm">2행 3열 구조. 선택 시 기록된 성장도가 괄호로 표시됩니다.</p>
        <button onClick={addDeck} className="text-sm tracking-widest hover:opacity-60 border border-black dark:border-white px-4 py-2">+ 추가</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {decks.map(deck => (
          <div key={deck.id} className="p-6 border border-black dark:border-white relative group">
            <button 
              onClick={() => deleteDeck(deck.id)} 
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
              title="덱 삭제"
            >
              <Trash2 size={16} />
            </button>
            <input type="text" value={deck.name} onChange={e => setDecks(decks.map(d=>d.id===deck.id ? {...d, name: e.target.value}:d))} className="bg-transparent text-lg tracking-widest mb-8 w-11/12 focus:outline-none border-b border-transparent focus:border-black dark:focus:border-white" />
            <DeckSelectGrid label="이마젠" type="f" options={metadata.filter(m=>m.category==='familiar')} deckId={deck.id} currentVals={deck.f} decks={decks} setDecks={setDecks} myLatestData={myLatestData} />
            <DeckSelectGrid label="액티브 스킬" type="a" options={metadata.filter(m=>m.category==='skill_active')} deckId={deck.id} currentVals={deck.a} decks={decks} setDecks={setDecks} myLatestData={myLatestData} />
            <DeckSelectGrid label="패시브 스킬" type="p" options={metadata.filter(m=>m.category==='skill_passive')} deckId={deck.id} currentVals={deck.p} decks={decks} setDecks={setDecks} myLatestData={myLatestData} />
            <div className="text-right mt-4">
              <button onClick={() => apiCall('save_deck', { username: user.name, deck })} className="text-xs border border-black dark:border-white px-3 py-1 hover:opacity-60 uppercase">덱 저장</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3-3. TAB SCORE (점수 관리)
// ==========================================
function TabScore({ metadata, myLogs, onSave }) {
  const scoreTypes = metadata.filter(m => m.category === 'score_type').map(m => m.item_name);
  const [selectedScore, setSelectedScore] = useState(scoreTypes[0] || '허수아비');
  const [newVal, setNewVal] = useState('');

  const handleAdd = async () => {
    await onSave(selectedScore, newVal);
    setNewVal('');
  };

  const filteredLogs = myLogs.filter(l => l.item === selectedScore).reverse(); // 최신순

  return (
    <div className="max-w-xl">
      <div className="flex gap-4 items-center mb-12">
        <select value={selectedScore} onChange={e => setSelectedScore(e.target.value)} className="bg-transparent border-b border-black dark:border-white py-2 focus:outline-none text-lg cursor-pointer flex-1">
          {scoreTypes.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
        </select>
        <input type="number" value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="점수 입력" className="bg-transparent border-b border-black dark:border-white py-2 focus:outline-none flex-1" />
        <button onClick={handleAdd} className="hover:opacity-60 border border-black dark:border-white px-4 py-2 flex items-center gap-2"><Plus size={16} /> 추가</button>
      </div>

      <h4 className="text-sm opacity-40 mb-4 border-b border-black dark:border-white pb-2">기록 누적 확인</h4>
      <div className="max-h-80 overflow-y-auto pr-4">
        {filteredLogs.length === 0 ? <p className="text-sm opacity-40 py-4">기록이 없습니다.</p> : (
          <table className="w-full text-sm text-left">
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={i} className="border-b border-black dark:border-white border-opacity-10">
                  <td className="py-3 w-1/3 opacity-60">{log.timestamp}</td>
                  <td className="py-3 w-2/3">{Number(log.value).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3-4. TAB STATS (유연한 SVG 차트 통계)
// ==========================================
function TabStats({ myLogs }) {
  const availableItems = [...new Set(myLogs.map(l => l.item))];
  const [selectedItem, setSelectedItem] = useState('전투력');
  const data = myLogs.filter(l => l.item === selectedItem);

  return (
    <div>
      <div className="flex items-center gap-4 mb-12">
        <p className="opacity-60 text-sm">확인할 항목:</p>
        <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className={`bg-transparent border-b border-black dark:border-white py-1 focus:outline-none cursor-pointer ${getColorClass(selectedItem)}`}>
          {availableItems.map(item => <option key={item} value={item} className="text-black">{item}</option>)}
        </select>
      </div>
      
      <div className="h-64 w-full max-w-3xl border border-black dark:border-white border-opacity-20 p-4 relative">
        {data.length < 2 ? (
          <div className="w-full h-full flex items-center justify-center opacity-40 text-sm">최소 2개의 기록이 필요합니다.</div>
        ) : (
          <SimpleLineChart data={data} colorClass={getColorClass(selectedItem)} />
        )}
      </div>
    </div>
  );
}

// SVG Line Chart Component
function SimpleLineChart({ data, colorClass }) {
  const maxVal = Math.max(...data.map(d => Number(d.value)));
  const minVal = Math.min(...data.map(d => Number(d.value)));
  const width = 800, height = 200, pad = 30;

  const points = data.map((d, i) => {
    const x = pad + (i * ((width - pad * 2) / (data.length - 1 || 1)));
    const y = height - pad - ((Number(d.value) - minVal) / ((maxVal - minVal) || 1)) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-full overflow-visible ${colorClass}`}>
      <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="currentColor" strokeOpacity="0.2" />
      <line x1={pad} y1={pad} x2={width-pad} y2={pad} stroke="currentColor" strokeOpacity="0.2" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
      {data.map((d, i) => {
        const x = pad + (i * ((width - pad * 2) / (data.length - 1 || 1)));
        const y = height - pad - ((Number(d.value) - minVal) / ((maxVal - minVal) || 1)) * (height - pad * 2);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="currentColor" />
            <text x={x} y={y - 12} fontSize="10" fill="currentColor" textAnchor="middle" opacity="0.8">{Number(d.value).toLocaleString()}</text>
            <text x={x} y={height+4} fontSize="10" fill="currentColor" textAnchor="middle" opacity="0.6">{d.timestamp.substring(5)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ==========================================
// 4. MANAGE PAGE (관리자 전용)
// ==========================================
function ManagePage({ user }) {
  if (!['MASTER', 'ELITE', 'ADMIN'].includes(user.role)) return null;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-light tracking-widest mb-8">관리자 메뉴</h2>
      <p className="opacity-60 text-sm mb-12">현재 메타데이터(목록) 수정은 구글 시트의 `Metadata` 탭에서 직접 관리합니다.</p>
      <div className="border border-black dark:border-white p-12 text-center opacity-40">
        [ 시스템 대시보드 준비 중 ]
      </div>
    </div>
  );
}