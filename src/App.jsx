import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sun, Moon, Menu, X, ChevronRight, LogOut, Trash2 } from 'lucide-react';

// ==========================================
// CONFIGURATION
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbzzfy5fOgQGtQ5dd_0ASxh_dINcecR778vCFerrgZh97P78d7FhTOGcYj2yxD1F4eQ/exec"; 

const ATTR_COLORS = {
  '불': 'text-red-500 dark:text-red-400 font-bold',
  '물': 'text-blue-500 dark:text-blue-400 font-bold',
  '나무': 'text-green-500 dark:text-green-400 font-bold',
  '빛': 'text-yellow-500 dark:text-yellow-400 font-bold',
  '어둠': 'text-purple-500 dark:text-purple-400 font-bold',
};

const JOB_LIST = ['소드맨', '위치', '디스트로이어', '엔지니어', '로그'];
const JOB_CATEGORY_MAP = {
  '소드맨': 'skill_s',
  '위치': 'skill_w',
  '디스트로이어': 'skill_d',
  '엔지니어': 'skill_e',
  '로그': 'skill_r'
};

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [userLogs, setUserLogs] = useState([]);
  const [userDecks, setUserDecks] = useState([]);
  const [metadata, setMetadata] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState('sign'); 
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  const toggleDark = () => setDark(!dark);
  const goPage = (p) => { setPage(p); setMenuOpen(false); };
  
  const logout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      setUser(null);
      setUserData({});
      setUserDecks([]);
      setPage('sign');
      setMenuOpen(false);
    }
  };

  // apiCall haguuggii useCallback tiin eegumsa mirkaneessi
  const apiCall = useCallback(async (action, payload = {}) => {
    if (!API_URL) {
      alert("시스템 오류: API_URL이 설정되지 않았습니다.");
      return null;
    }
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();
      setLoading(false);
      if (data.status === 'error') {
        alert(data.message);
        return null;
      }
      return data;
    } catch (e) {
      setLoading(false);
      alert("서버와 통신하는 중 문제가 발생했습니다: " + e.message);
      return null;
    }
  }, []);

  // 비동기 함수로 안전하게 초기 데이터 로드 (ESLint set-state-in-effect 해결)
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      if (API_URL) {
        const res = await apiCall('get_metadata');
        if (isMounted && res && res.metadata) {
          setMetadata(res.metadata);
        }
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, [apiCall]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'dark' : ''}`}>
      <LoadingOverlay visible={loading} />
      
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
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
                <button onClick={() => goPage('personal')} className={`hover:opacity-60 ${page === 'personal' ? 'font-bold' : ''}`}>마이페이지</button>
                {['master', 'elite', 'admin', 'MASTER', 'ELITE', 'ADMIN'].includes(user.role) && (
                  <button onClick={() => goPage('manage')} className={`hover:opacity-60 ${page === 'manage' ? 'font-bold' : ''}`}>관리</button>
                )}
                <button onClick={logout} className="hover:opacity-60 flex items-center gap-2 text-red-500"><LogOut size={16} /> 로그아웃</button>
              </div>
            )}
          </div>
        </nav>

        {menuOpen && user && (
          <div className="md:hidden flex flex-col p-6 gap-6 text-lg max-w-7xl mx-auto">
            <button onClick={() => goPage('kingdom')} className="text-left hover:opacity-60">킹덤</button>
            <button onClick={() => goPage('personal')} className="text-left hover:opacity-60">마이페이지</button>
            {['master', 'elite', 'admin', 'MASTER', 'ELITE', 'ADMIN'].includes(user.role) && (
              <button onClick={() => goPage('manage')} className="text-left hover:opacity-60">관리</button>
            )}
            <button onClick={logout} className="text-left hover:opacity-60 text-red-500">로그아웃</button>
          </div>
        )}

        <main className="p-6 max-w-7xl mx-auto mt-4 pb-20">
          {!user ? (
            <SignPage 
              apiCall={apiCall} 
              onLoginSuccess={(u, d, l, dk) => {
                setUser(u); setUserData(d); setUserLogs(l); setUserDecks(dk); setPage('personal');
              }} 
            />
          ) : (
            <>
              {page === 'kingdom' && <KingdomPage apiCall={apiCall} metadata={metadata} />}
              {page === 'personal' && (
                <PersonalPage 
                  user={user} setUser={setUser}
                  userData={userData} setUserData={setUserData}
                  userLogs={userLogs} setUserLogs={setUserLogs}
                  userDecks={userDecks} setUserDecks={setUserDecks}
                  metadata={metadata} apiCall={apiCall}
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
// GLOBALS & HELPER COMPONENTS
// ==========================================
const LoadingOverlay = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm transition-opacity">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
    </div>
  );
};

// 킹덤 페이지용 테이블 헤더 컴포넌트 독립 분리 (ESLint static-components 해결)
const Th = ({ label }) => (
  <th className="text-left py-4 px-6 font-normal tracking-wider whitespace-nowrap">{label}</th>
);

// ==========================================
// 1. SIGN PAGE
// ==========================================
function SignPage({ apiCall, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !pwd) return alert("닉네임과 비밀번호를 입력해주세요.");

    const hashedPwd = await hashPassword(pwd);

    if (isLogin) {
      const res = await apiCall('login', { username: name, password_hash: hashedPwd });
      if (res) onLoginSuccess(res.user, res.userData, res.userLogs, res.decks);
    } else {
      const res = await apiCall('register', { username: name, password_hash: hashedPwd });
      if (res) {
        alert("가입이 완료되었습니다. 로그인해주세요.");
        setIsLogin(true);
        setPwd('');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 animate-fade-in">
      <h1 className="text-3xl font-light mb-12 tracking-widest uppercase">{isLogin ? '로그인' : '회원가입'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <input type="text" placeholder="닉네임" value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none placeholder:opacity-40" />
        <input type="password" placeholder="비밀번호" value={pwd} onChange={e => setPwd(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none placeholder:opacity-40" />
        <div className="flex justify-between items-center mt-4">
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm opacity-60 hover:opacity-100 tracking-wider">
            {isLogin ? '계정 생성하기' : '로그인으로 돌아가기'}
          </button>
          <button type="submit" className="tracking-widest flex items-center gap-2 hover:opacity-60 border border-black dark:border-white px-6 py-2">
            {isLogin ? '로그인' : '가입'} <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// 2. KINGDOM PAGE
// ==========================================
function KingdomPage({ apiCall, metadata }) {
  const [view, setView] = useState('basic'); 
  const [data, setData] = useState([]);
  
  const reqFamiliars = useMemo(() => metadata.filter(m => m.category === 'familiar' && Number(m.basic) === 1).map(m => m.item_name), [metadata]);
  const reqSkills = useMemo(() => metadata.filter(m => (m.category === 'skill_passive' || m.category === 'skill_active') && Number(m.basic) === 1).map(m => m.item_name), [metadata]);

  useEffect(() => {
    apiCall('get_kingdom').then(res => {
      if (res && res.data) {
        const sorted = res.data.sort((a, b) => (Number(b.data['전투력']) || 0) - (Number(a.data['전투력']) || 0));
        setData(sorted);
      }
    });
  }, [apiCall]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <h2 className="text-2xl font-light tracking-widest">킹덤 멤버 현황</h2>
        <div className="flex gap-6 text-sm tracking-widest">
          <button onClick={() => setView('basic')} className={`hover:opacity-60 ${view === 'basic' ? 'border-b border-black dark:border-white font-bold' : 'opacity-40'}`}>기본 정보</button>
          <button onClick={() => setView('familiar')} className={`hover:opacity-60 ${view === 'familiar' ? 'border-b border-black dark:border-white font-bold' : 'opacity-40'}`}>이마젠</button>
          <button onClick={() => setView('skill')} className={`hover:opacity-60 ${view === 'skill' ? 'border-b border-black dark:border-white font-bold' : 'opacity-40'}`}>스킬</button>
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-sm">
          <thead className="border-b border-black dark:border-white">
            <tr>
              <Th label="순번" />
              <Th label="닉네임" />
              {view === 'basic' && (
                <>
                  <Th label="직업" />
                  <Th label="전투력" />
                </>
              )}
              {view === 'familiar' && reqFamiliars.map(f => <Th key={f} label={f} />)}
              {view === 'skill' && reqSkills.map(s => <Th key={s} label={s} />)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="group border-b border-transparent hover:border-black dark:hover:border-white hover:border-opacity-10 transition-colors">
                <td className="py-4 px-6 whitespace-nowrap opacity-60">{idx + 1}</td>
                <td className="py-4 px-6 whitespace-nowrap font-bold">{row.username}</td>
                {view === 'basic' && (
                  <>
                    <td className="py-4 px-6 whitespace-nowrap opacity-80">{row.job || '-'}</td>
                    <td className="py-4 px-6 whitespace-nowrap text-blue-500 dark:text-blue-400 font-bold">{Number(row.data['전투력'] || 0).toLocaleString()}</td>
                  </>
                )}
                {view === 'familiar' && reqFamiliars.map(f => (
                  <td key={f} className="py-4 px-6 whitespace-nowrap opacity-80">{row.data[f] || '-'}</td>
                ))}
                {view === 'skill' && reqSkills.map(s => (
                  <td key={s} className="py-4 px-6 whitespace-nowrap opacity-80">{row.data[s] || '-'}</td>
                ))}
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
function PersonalPage({ user, setUser, userData, setUserData, userLogs, setUserLogs, userDecks, setUserDecks, metadata, apiCall }) {
  const [tab, setTab] = useState('데이터 편집');
  
  const getAttrColor = (itemName) => {
    const meta = metadata.find(m => m.item_name === itemName);
    return meta && meta.attribute ? ATTR_COLORS[meta.attribute] : '';
  };

  const [tempData, setTempData] = useState(userData);
  const [jobState, setJobState] = useState(user.job || '');

  const handleInput = (item, val) => setTempData(prev => ({...prev, [item]: val}));
  
  const handleSaveData = async () => {
    let logsToSave = [];
    Object.keys(tempData).forEach(key => {
      if (tempData[key] !== userData[key]) {
        logsToSave.push({ item: key, value: tempData[key] });
      }
    });

    if (logsToSave.length === 0 && jobState === user.job) return alert("변경된 데이터가 없습니다.");

    const res = await apiCall('update_data', { username: user.username, job: jobState, logs: logsToSave });
    if (res) {
      alert("데이터가 성공적으로 저장되었습니다.");
      setUserData(tempData);
      setUser({...user, job: jobState});
    }
  };

  const renderDataSection = (title, category) => {
    const items = metadata.filter(m => m.category === category);
    if (items.length === 0 && category !== 'stats') return null;

    const displayedItems = items.filter(m => Number(m.basic) === 1 || (tempData[m.item_name] !== undefined && tempData[m.item_name] !== ''));
    const addableItems = items.filter(m => Number(m.basic) === 0 && (!tempData[m.item_name] || tempData[m.item_name] === ''));

    return (
      <div className="mb-12 w-full max-w-2xl border border-black dark:border-white p-6 relative">
        <h3 className="text-sm tracking-widest font-bold mb-6 bg-black text-white dark:bg-white dark:text-black inline-block px-4 py-1">{title}</h3>
        
        {category === 'stats' && (
          <div className="flex flex-col md:flex-row border-b border-black dark:border-white border-opacity-20 dark:border-opacity-20 mb-4 pb-2">
            <div className="w-full md:w-1/3 py-2 opacity-60">직업</div>
            <div className="w-full md:w-2/3">
              <select value={jobState} onChange={e => setJobState(e.target.value)} className="w-full bg-transparent py-2 focus:outline-none appearance-none">
                <option value="" className="text-black">- 선택 -</option>
                {JOB_LIST.map(j => <option key={j} value={j} className="text-black">{j}</option>)}
              </select>
            </div>
          </div>
        )}

        {displayedItems.map(m => (
          <div key={m.item_name} className="flex flex-col md:flex-row border-b border-black dark:border-white border-opacity-20 dark:border-opacity-20 mb-2 pb-2">
            <div className={`w-full md:w-1/3 py-2 flex items-center justify-between ${getAttrColor(m.item_name) || 'opacity-80'}`}>
              <span>{m.item_name}</span>
              {Number(m.basic) === 0 && (
                <button onClick={() => {
                  const newTemp = {...tempData};
                  delete newTemp[m.item_name];
                  setTempData(newTemp);
                }} className="text-xs text-red-500 mr-4 md:hidden">삭제</button>
              )}
            </div>
            <div className="w-full md:w-2/3 flex items-center">
              <input type="text" value={tempData[m.item_name] || ''} onChange={(e) => handleInput(m.item_name, e.target.value)} placeholder="수치 기입" className="w-full bg-transparent py-2 focus:outline-none" />
              {Number(m.basic) === 0 && (
                <button onClick={() => {
                  const newTemp = {...tempData};
                  delete newTemp[m.item_name];
                  setTempData(newTemp);
                }} className="text-xs text-red-500 ml-4 hidden md:block hover:opacity-60"><Trash2 size={16}/></button>
              )}
            </div>
          </div>
        ))}

        {addableItems.length > 0 && (
          <div className="mt-6 flex gap-4">
            <select id={`add-${category}`} className="bg-transparent border-b border-black dark:border-white py-1 focus:outline-none text-sm w-1/2">
              <option value="" className="text-black">- 항목 선택 -</option>
              {addableItems.map(m => <option key={m.item_name} value={m.item_name} className="text-black">{m.item_name}</option>)}
            </select>
            <button onClick={() => {
              const sel = document.getElementById(`add-${category}`);
              if(sel.value) handleInput(sel.value, '0');
            }} className="text-xs border border-black dark:border-white px-4 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
              + 추가
            </button>
          </div>
        )}
      </div>
    );
  };

  const [scoreType, setScoreType] = useState('');
  const [scoreVal, setScoreVal] = useState('');

  const handleAddScore = async () => {
    if (!scoreType || !scoreVal) return alert("종류와 점수를 기입해주세요.");
    const res = await apiCall('update_data', { username: user.username, job: user.job, logs: [{ item: scoreType, value: scoreVal }] });
    if (res) {
      alert("점수가 기록되었습니다.");
      setScoreVal('');
      setUserLogs([...userLogs, { timestamp: new Date().toISOString(), item: scoreType, value: scoreVal }]);
    }
  };

  const scoreItems = metadata.filter(m => m.category === 'score_type').map(m => m.item_name);
  const scoreHistory = userLogs.filter(l => scoreItems.includes(l.item)).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  const [tempDecks, setTempDecks] = useState(userDecks);

  const addDeck = () => {
    if (tempDecks.length >= 30) return alert('덱은 최대 30개까지 생성 가능합니다.');
    const newDeck = { deck_id: Date.now(), name: `덱 ${tempDecks.length + 1}`, f1:'', f2:'', f3:'', a1:'', a2:'', a3:'', p1:'', p2:'', p3:'' };
    setTempDecks([...tempDecks, newDeck]);
  };
  
  const updateDeck = (id, field, val) => {
    setTempDecks(tempDecks.map(d => d.deck_id === id ? { ...d, [field]: val } : d));
  };

  const handleSaveDecks = async () => {
    const res = await apiCall('save_decks', { username: user.username, decks: tempDecks });
    if (res) {
      alert("덱이 성공적으로 저장되었습니다.");
      setUserDecks(tempDecks);
    }
  };

  const getSelectOptions = (category) => {
    let list = metadata.filter(m => m.category === category).map(m => m.item_name);
    if (category === 'skill_active' && user.job && JOB_CATEGORY_MAP[user.job]) {
      const jobSkills = metadata.filter(m => m.category === JOB_CATEGORY_MAP[user.job]).map(m => m.item_name);
      list = [...list, ...jobSkills];
    }
    return list;
  };

  const DeckSelect = ({ options, val, onChange }) => (
    <select value={val} onChange={e => onChange(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-1 focus:outline-none text-sm appearance-none truncate">
      <option value="" className="text-black">- 미착용 -</option>
      {options.map(opt => (
        <option key={opt} value={opt} className={`text-black ${getAttrColor(opt)}`}>
          {opt} {userData[opt] ? `(${userData[opt]})` : ''}
        </option>
      ))}
    </select>
  );

  const [statItem, setStatItem] = useState('전투력');
  const chartData = userLogs.filter(l => l.item === statItem).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  
  const handleChangePassword = async () => {
    if (!pw1 || pw1 !== pw2) return alert("비밀번호가 일치하지 않거나 비어있습니다.");
    const hashedPwd = await hashPassword(pw1);
    const res = await apiCall('update_password', { username: user.username, password_hash: hashedPwd });
    if (res) {
      alert("비밀번호가 성공적으로 변경되었습니다.");
      setPw1(''); setPw2('');
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-light tracking-widest mb-2">{user.username}</h2>
      <p className="opacity-40 text-sm mb-12 tracking-widest">{user.role}</p>

      <div className="flex gap-8 text-sm tracking-widest mb-12 border-b border-black dark:border-white pb-4 overflow-x-auto">
        {['데이터 편집', '점수', '덱 설정', '통계', '비밀번호 변경'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap hover:opacity-60 ${tab === t ? 'font-bold border-b-2 border-black dark:border-white pb-1' : 'opacity-40'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === '데이터 편집' && (
        <div className="flex flex-col gap-4">
          <div className="mb-6">
            <button onClick={handleSaveData} className="uppercase tracking-widest flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-6 py-3 text-sm hover:opacity-80 transition-opacity">
              전체 저장하기 <ChevronRight size={16} />
            </button>
          </div>
          {renderDataSection("능력치", "stats")}
          {renderDataSection("이마젠", "familiar")}
          {renderDataSection("공용 패시브 스킬", "skill_passive")}
          {renderDataSection("공용 액티브 스킬", "skill_active")}
          {jobState && renderDataSection(`${jobState} 전용 스킬`, JOB_CATEGORY_MAP[jobState])}
        </div>
      )}

      {tab === '점수' && (
        <div className="max-w-xl">
          <div className="border border-black dark:border-white p-8 mb-12">
            <h3 className="text-sm font-bold mb-6">새 점수 기록하기</h3>
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="w-full md:w-1/2">
                <label className="text-xs opacity-60 block mb-2">목록 선택</label>
                <select value={scoreType} onChange={e=>setScoreType(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none">
                  <option value="" className="text-black">- 선택 -</option>
                  {scoreItems.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                </select>
              </div>
              <div className="w-full md:w-1/2">
                <label className="text-xs opacity-60 block mb-2">점수 기입</label>
                <input type="number" value={scoreVal} onChange={e=>setScoreVal(e.target.value)} placeholder="0" className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none" />
              </div>
              <button onClick={handleAddScore} className="border border-black dark:border-white px-6 py-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black whitespace-nowrap">추가</button>
            </div>
          </div>

          <h3 className="text-sm font-bold mb-6 opacity-60">과거 기록 (최신순)</h3>
          <div className="max-h-96 overflow-y-auto space-y-4 pr-4">
            {scoreHistory.length === 0 && <p className="opacity-40 text-sm">기록된 점수가 없습니다.</p>}
            {scoreHistory.map((l, i) => (
              <div key={i} className="flex justify-between border-b border-black dark:border-white border-opacity-20 pb-2 text-sm">
                <div className="opacity-60">{new Date(l.timestamp).toLocaleDateString()}</div>
                <div className="font-bold">{l.item}</div>
                <div className="text-blue-500 dark:text-blue-400">{Number(l.value).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === '덱 설정' && (
        <div>
          <div className="flex justify-between items-center mb-8">
            <button onClick={addDeck} className="text-sm tracking-widest hover:opacity-60 border border-black dark:border-white px-4 py-2">+ 새 덱 추가</button>
            <button onClick={handleSaveDecks} className="text-sm tracking-widest bg-black text-white dark:bg-white dark:text-black px-6 py-2">덱 전체 저장</button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tempDecks.length === 0 && <p className="opacity-40 text-sm">생성된 덱이 없습니다.</p>}
            {tempDecks.map((deck) => (
              <div key={deck.deck_id} className="p-6 border border-black dark:border-white relative group">
                <button onClick={() => setTempDecks(tempDecks.filter(d => d.deck_id !== deck.deck_id))} className="absolute top-6 right-6 opacity-40 hover:!opacity-100 transition-opacity text-red-500">
                  <Trash2 size={18} />
                </button>
                <input 
                  type="text" value={deck.name} onChange={(e) => updateDeck(deck.deck_id, 'name', e.target.value)}
                  className="bg-transparent text-lg font-bold mb-8 w-3/4 focus:outline-none border-b border-transparent focus:border-black dark:focus:border-white"
                />
                
                <div className="space-y-6 text-sm">
                  <div>
                    <span className="opacity-40 uppercase text-xs tracking-wider block mb-2 font-bold">이마젠</span>
                    <div className="grid grid-cols-3 gap-4">
                      {['f1', 'f2', 'f3'].map(k => <DeckSelect key={k} options={getSelectOptions('familiar')} val={deck[k]} onChange={(v)=>updateDeck(deck.deck_id, k, v)} />)}
                    </div>
                  </div>
                  <div>
                    <span className="opacity-40 uppercase text-xs tracking-wider block mb-2 font-bold">액티브 스킬</span>
                    <div className="grid grid-cols-3 gap-4">
                      {['a1', 'a2', 'a3'].map(k => <DeckSelect key={k} options={getSelectOptions('skill_active')} val={deck[k]} onChange={(v)=>updateDeck(deck.deck_id, k, v)} />)}
                    </div>
                  </div>
                  <div>
                    <span className="opacity-40 uppercase text-xs tracking-wider block mb-2 font-bold">패시브 스킬</span>
                    <div className="grid grid-cols-3 gap-4">
                      {['p1', 'p2', 'p3'].map(k => <DeckSelect key={k} options={getSelectOptions('skill_passive')} val={deck[k]} onChange={(v)=>updateDeck(deck.deck_id, k, v)} />)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === '통계' && (
        <div className="max-w-3xl">
          <div className="mb-8">
            <select value={statItem} onChange={e=>setStatItem(e.target.value)} className="bg-transparent border-b border-black dark:border-white py-2 focus:outline-none text-lg font-bold">
              <option value="전투력" className="text-black">전투력</option>
              {[...new Set(userLogs.map(l=>l.item))].filter(i=>i!=='전투력').map(s => <option key={s} value={s} className="text-black">{s}</option>)}
            </select>
          </div>
          <div className="h-64 w-full">
            <SimpleLineChart data={chartData} />
          </div>
        </div>
      )}

      {tab === '비밀번호 변경' && (
        <div className="max-w-md">
          <div className="flex flex-col gap-6">
            <input type="password" value={pw1} onChange={e=>setPw1(e.target.value)} placeholder="새 비밀번호 입력" className="bg-transparent border-b border-black dark:border-white py-2 focus:outline-none" />
            <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="새 비밀번호 확인" className="bg-transparent border-b border-black dark:border-white py-2 focus:outline-none" />
            <button onClick={handleChangePassword} className="border border-black dark:border-white px-6 py-3 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black mt-4">비밀번호 변경하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SVG CHART COMPONENT
// ==========================================
function SimpleLineChart({ data }) {
  if (!data || data.length === 0) return <p className="text-sm opacity-40">해당 항목의 기록이 없습니다.</p>;
  if (data.length === 1) return <p className="text-sm opacity-40">최소 2개 이상의 기록이 필요합니다. (현재: {data[0].value})</p>;
  
  const values = data.map(d => Number(d.value) || 0);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const diff = maxVal - minVal || 1;
  
  const width = 800;
  const height = 200;
  const pad = 20;

  const points = data.map((d, i) => {
    const x = pad + (i * ((width - pad * 2) / (data.length - 1)));
    const y = height - pad - (((Number(d.value)||0) - minVal) / diff) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="currentColor" strokeOpacity="0.2" />
      <line x1={pad} y1={pad} x2={width-pad} y2={pad} stroke="currentColor" strokeOpacity="0.2" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
      {data.map((d, i) => {
        const x = pad + (i * ((width - pad * 2) / (data.length - 1)));
        const y = height - pad - (((Number(d.value)||0) - minVal) / diff) * (height - pad * 2);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="currentColor" />
            <text x={x} y={y - 10} fontSize="10" fill="currentColor" textAnchor="middle" opacity="0.8">
              {Number(d.value).toLocaleString()}
            </text>
            <text x={x} y={height+15} fontSize="10" fill="currentColor" textAnchor="middle" opacity="0.4">
              {new Date(d.timestamp).toLocaleDateString().slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ==========================================
// 4. MANAGE PAGE
// ==========================================
function ManagePage({ user }) {
  const isAllowed = ['master', 'elite', 'admin', 'MASTER', 'ELITE', 'ADMIN'].includes(user.role);

  if (!isAllowed) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="tracking-widest uppercase opacity-40">접근 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-light tracking-widest mb-8">관리자 메뉴</h2>
      <p className="opacity-60 text-sm mb-12">
        길드장(MASTER), 운영진(ELITE), 관리자(ADMIN) 전용 시스템 대시보드.
      </p>
      <div className="border border-black dark:border-white p-12 text-center opacity-40">
        [ 길드원 관리 및 메타데이터 수정 기능은 추후 업데이트 예정입니다. ]<br/>
        현재 데이터 편집은 Google Sheet에서 직접 수행하시기 바랍니다.
      </div>
    </div>
  );
}