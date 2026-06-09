import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sun, Moon, Menu, X, ChevronRight, LogOut, Trash2 } from 'lucide-react';
import React from 'react';

// ==========================================
// CONFIGURATION
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbzVZDWkXCiBEUDZxe-ApSH8X3M-BdylNHOjbvIiiUnMsuQHX4c_gJP032zb2jUbjUU/exec"; 

const ATTR_COLORS = {
  '불': 'text-red-500 dark:text-red-400 font-bold',
  '물': 'text-blue-500 dark:text-blue-400 font-bold',
  '나무': 'text-green-500 dark:text-green-400 font-bold',
  '빛': 'text-yellow-500 dark:text-yellow-400 font-bold',
  '어둠': 'text-purple-500 dark:text-purple-400 font-bold',
};

const getAttrColor = (text) => {
  if (!text) return '';
  for (let key in ATTR_COLORS) {
    if (text.includes(key)) return ATTR_COLORS[key];
  }
  return '';
};

// 직업별 배경색 (라이트 모드 고정 파스텔, 다크 모드 투명도 20%)
const getJobRowClass = (job) => {
  switch (job) {
    case '소드맨': return 'bg-[#C9DAF8] dark:bg-[#C9DAF8]/20 text-black dark:text-white';
    case '위치': return 'bg-[#FCE5CD] dark:bg-[#FCE5CD]/20 text-black dark:text-white';
    case '엔지니어': return 'bg-[#FFF2CC] dark:bg-[#FFF2CC]/20 text-black dark:text-white';
    case '로그': return 'bg-[#D9EAD3] dark:bg-[#D9EAD3]/20 text-black dark:text-white';
    case '디스트로이어': return 'bg-[#EAD1DC] dark:bg-[#EAD1DC]/20 text-black dark:text-white';
    default: return '';
  }
};

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
  
  // LocalStorage를 활용한 상태 초기화
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('g_user')) || null);
  const [userData, setUserData] = useState(() => JSON.parse(localStorage.getItem('g_userData')) || {});
  const [userLogs, setUserLogs] = useState(() => JSON.parse(localStorage.getItem('g_userLogs')) || []);
  const [userDecks, setUserDecks] = useState(() => JSON.parse(localStorage.getItem('g_userDecks')) || []);
  const [metadata, setMetadata] = useState(() => JSON.parse(localStorage.getItem('g_metadata')) || []);
  
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(user ? 'personal' : 'sign'); 
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  // 상태 변경 시 로컬스토리지 자동 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem('g_user', JSON.stringify(user));
      localStorage.setItem('g_userData', JSON.stringify(userData));
      localStorage.setItem('g_userLogs', JSON.stringify(userLogs));
      localStorage.setItem('g_userDecks', JSON.stringify(userDecks));
    } else {
      localStorage.clear();
    }
  }, [user, userData, userLogs, userDecks]);

  useEffect(() => {
    if (metadata.length > 0) localStorage.setItem('g_metadata', JSON.stringify(metadata));
  }, [metadata]);

  const toggleDark = () => setDark(!dark);
  const goPage = (p) => { setPage(p); setMenuOpen(false); };
  
  const logout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      setUser(null);
      setUserData({});
      setUserLogs([]);
      setUserDecks([]);
      setPage('sign');
      setMenuOpen(false);
    }
  };

  const apiCall = useCallback(async (action, payload = {}) => {
    if (!API_URL) {
      alert("시스템 오류: API_URL이 설정되지 않았습니다.");
      return null;
    }
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      if (API_URL && metadata.length === 0) {
        const res = await apiCall('get_metadata');
        if (isMounted && res && res.metadata) setMetadata(res.metadata);
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, [apiCall, metadata.length]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'dark' : ''}`}>
      <LoadingOverlay visible={loading} />
      
      <div className="min-h-screen bg-white text-black dark:bg-[#111] dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <nav className="p-4 md:p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-black/10 dark:border-white/10">
          <div className="text-lg md:text-xl font-bold tracking-widest uppercase cursor-pointer" onClick={() => user && goPage('kingdom')}>
            GUILD_NAME
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={toggleDark} className="hover:opacity-60 transition-opacity">
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user && (
              <button className="md:hidden hover:opacity-60" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
            {user && (
              <div className="hidden md:flex items-center gap-6 text-sm tracking-wide">
                <button onClick={() => goPage('kingdom')} className={`hover:opacity-60 ${page === 'kingdom' ? 'font-bold' : ''}`}>킹덤</button>
                <button onClick={() => goPage('personal')} className={`hover:opacity-60 ${page === 'personal' ? 'font-bold' : ''}`}>마이페이지</button>
                {['master', 'elite', 'admin', 'MASTER', 'ELITE', 'ADMIN'].includes(user.role) && (
                  <button onClick={() => goPage('manage')} className={`hover:opacity-60 ${page === 'manage' ? 'font-bold' : ''}`}>관리</button>
                )}
                <button onClick={logout} className="hover:opacity-60 flex items-center gap-1 text-red-500"><LogOut size={16} /> 로그아웃</button>
              </div>
            )}
          </div>
        </nav>

        {menuOpen && user && (
          <div className="md:hidden flex flex-col p-6 gap-6 text-base max-w-7xl mx-auto border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#111] absolute w-full z-40 shadow-xl">
            <button onClick={() => goPage('kingdom')} className="text-left font-bold tracking-widest">킹덤</button>
            <button onClick={() => goPage('personal')} className="text-left font-bold tracking-widest">마이페이지</button>
            {['master', 'elite', 'admin', 'MASTER', 'ELITE', 'ADMIN'].includes(user.role) && (
              <button onClick={() => goPage('manage')} className="text-left font-bold tracking-widest">관리</button>
            )}
            <button onClick={logout} className="text-left font-bold tracking-widest text-red-500">로그아웃</button>
          </div>
        )}

        <main className="p-4 md:p-6 max-w-7xl mx-auto mt-2 pb-20">
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
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  );
};

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
    <div className="max-w-md mx-auto mt-16 md:mt-20 animate-fade-in p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-10 tracking-widest uppercase">{isLogin ? '로그인' : '회원가입'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <input type="text" placeholder="닉네임" value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none placeholder:opacity-40" />
        <input type="password" placeholder="비밀번호" value={pwd} onChange={e => setPwd(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none placeholder:opacity-40" />
        <div className="flex justify-between items-center mt-2">
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-xs md:text-sm opacity-60 hover:opacity-100 font-bold tracking-wider">
            {isLogin ? '계정 생성하기' : '로그인으로 돌아가기'}
          </button>
          <button type="submit" className="tracking-widest font-bold flex items-center gap-1 hover:opacity-60 bg-black text-white dark:bg-white dark:text-black px-4 py-2 md:px-6 md:py-2 text-sm">
            {isLogin ? '로그인' : '가입'} <ChevronRight size={16} />
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
  
  // 정렬 기능 상태
  const [sortConfig, setSortConfig] = useState({ key: 'cp', direction: 'desc' });

  const reqFamiliars = useMemo(() => metadata.filter(m => m.category === 'familiar' && Number(m.basic) === 1).map(m => m.item_name), [metadata]);
  const reqSkills = useMemo(() => metadata.filter(m => (m.category === 'skill_passive' || m.category === 'skill_active') && Number(m.basic) === 1).map(m => m.item_name), [metadata]);

  useEffect(() => {
    apiCall('get_kingdom').then(res => {
      if (res && res.data) {
        setData(res.data);
      }
    });
  }, [apiCall]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    sortableItems.sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'cp') {
        aVal = Number(a.data['전투력'] || 0);
        bVal = Number(b.data['전투력'] || 0);
      } else if (sortConfig.key === 'nickname') {
        aVal = a.username;
        bVal = b.username;
      } else if (sortConfig.key === 'job') {
        aVal = a.job || '';
        bVal = b.job || '';
      } else {
        return 0; // 기타 정렬 미지원
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [data, sortConfig]);

  const Th = ({ label, sortKey, align='left' }) => (
    <th 
      onClick={() => sortKey && handleSort(sortKey)}
      className={`py-2 px-2 text-[11px] md:text-sm font-bold tracking-wider whitespace-nowrap border-b border-black dark:border-white text-${align} ${sortKey ? 'cursor-pointer hover:opacity-60' : ''}`}
    >
      {label} {sortConfig.key === sortKey ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-widest">킹덤 멤버 현황</h2>
        <div className="flex gap-4 text-xs md:text-sm font-bold tracking-widest">
          <button onClick={() => setView('basic')} className={`hover:opacity-60 ${view === 'basic' ? 'border-b-2 border-black dark:border-white' : 'opacity-40'}`}>기본 정보</button>
          <button onClick={() => setView('familiar')} className={`hover:opacity-60 ${view === 'familiar' ? 'border-b-2 border-black dark:border-white' : 'opacity-40'}`}>이마젠</button>
          <button onClick={() => setView('skill')} className={`hover:opacity-60 ${view === 'skill' ? 'border-b-2 border-black dark:border-white' : 'opacity-40'}`}>스킬</button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full text-xs md:text-sm text-left">
          <thead>
            <tr>
              <th className="w-4 border-b border-black dark:border-white"></th> {/* 순번: 텍스트 삭제 및 최소 너비 */}
              <Th label="닉네임" sortKey="nickname" />
              {view === 'basic' && (
                <>
                  <Th label="직업" sortKey="job" />
                  <Th label="전투력" sortKey="cp" align="right" />
                </>
              )}
              {view === 'familiar' && reqFamiliars.map(f => <Th key={f} label={f} />)}
              {view === 'skill' && reqSkills.map(s => <Th key={s} label={s} />)}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={idx} className={`border-b border-black/10 dark:border-white/10 transition-colors ${getJobRowClass(row.job)}`}>
                <td className="py-2 px-1 text-[10px] md:text-xs text-center opacity-60 font-mono">{idx + 1}</td>
                <td className="py-2 px-2 whitespace-nowrap font-bold tracking-wide">{row.username}</td>
                {view === 'basic' && (
                  <>
                    <td className="py-2 px-2 whitespace-nowrap font-bold opacity-80">{row.job || '-'}</td>
                    <td className="py-2 px-2 whitespace-nowrap font-bold text-right tracking-wider">{Number(row.data['전투력'] || 0).toLocaleString()}</td>
                  </>
                )}
                {view === 'familiar' && reqFamiliars.map(f => (
                  <td key={f} className="py-2 px-2 whitespace-nowrap font-bold opacity-80">{row.data[f] || '-'}</td>
                ))}
                {view === 'skill' && reqSkills.map(s => (
                  <td key={s} className="py-2 px-2 whitespace-nowrap font-bold opacity-80">{row.data[s] || '-'}</td>
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
  const [tempData, setTempData] = useState(userData);
  
  // Custom Modal State for adding items
  const [addModal, setAddModal] = useState({ isOpen: false, categoryTitle: '', items: [] });

  const handleInput = (item, val) => setTempData(prev => ({...prev, [item]: val}));
  
  const handleSaveData = async () => {
    let logsToSave = [];
    Object.keys(tempData).forEach(key => {
      if (tempData[key] !== userData[key]) {
        logsToSave.push({ item: key, value: tempData[key] });
      }
    });

    if (logsToSave.length === 0) return alert("변경된 데이터가 없습니다.");

    // jobState 제거됨 (사용자 job은 고정)
    const res = await apiCall('update_data', { username: user.username, job: user.job, logs: logsToSave });
    if (res) {
      alert("데이터가 성공적으로 저장되었습니다.");
      setUserData(tempData);
    }
  };

  const renderDataSection = (title, category) => {
    const items = metadata.filter(m => m.category === category);
    if (items.length === 0) return null;

    const displayedItems = items.filter(m => Number(m.basic) === 1 || (tempData[m.item_name] !== undefined && tempData[m.item_name] !== ''));
    const addableItems = items.filter(m => Number(m.basic) === 0 && (!tempData[m.item_name] || tempData[m.item_name] === ''));

    return (
      <div className="mb-6 w-full border border-black/20 dark:border-white/20 p-3 md:p-4 bg-black/5 dark:bg-white/5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm md:text-base tracking-widest font-bold uppercase">{title}</h3>
          {addableItems.length > 0 && (
            <button 
              onClick={() => setAddModal({ isOpen: true, categoryTitle: title, items: addableItems })}
              className="text-[10px] md:text-xs font-bold border border-black dark:border-white px-3 py-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              + 항목 추가
            </button>
          )}
        </div>
        
        {/* 4열 강제 그리드 구조 (모바일에서도 2쌍(4열) 유지) */}
        <div className="grid grid-cols-[auto_1fr_auto_1fr] md:grid-cols-[auto_1fr_auto_1fr_auto_1fr] gap-x-2 gap-y-3 items-center">
          {displayedItems.map(m => (
            <React.Fragment key={m.item_name}>
              {/* LABEL */}
              <div className={`text-[10px] md:text-xs font-bold truncate flex justify-between items-center ${getAttrColor(m.item_name)}`}>
                <span className="truncate pr-1">{m.item_name}</span>
                {Number(m.basic) === 0 && (
                  <button onClick={() => {
                    const newTemp = {...tempData};
                    delete newTemp[m.item_name];
                    setTempData(newTemp);
                  }} className="text-red-500 font-bold ml-1 opacity-60 hover:opacity-100">✕</button>
                )}
              </div>
              {/* INPUT */}
              <div>
                <input 
                  type="text" 
                  value={tempData[m.item_name] || ''} 
                  onChange={(e) => handleInput(m.item_name, e.target.value)} 
                  placeholder="0" 
                  className="w-full bg-transparent border-b border-black/30 dark:border-white/30 text-xs md:text-sm px-1 py-1 focus:outline-none focus:border-black dark:focus:border-white transition-colors" 
                />
              </div>
            </React.Fragment>
          ))}
        </div>
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
    <select value={val} onChange={e => onChange(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-1 focus:outline-none text-[10px] md:text-xs font-bold appearance-none truncate">
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
      <h2 className="text-2xl md:text-3xl font-bold tracking-widest mb-1">{user.username}</h2>
      <p className="opacity-60 text-xs md:text-sm font-bold mb-8 md:mb-12 tracking-widest">{user.role} / {user.job}</p>

      <div className="flex gap-4 md:gap-8 text-xs md:text-sm font-bold tracking-widest mb-8 border-b border-black/20 dark:border-white/20 pb-2 overflow-x-auto">
        {['데이터 편집', '점수', '덱 설정', '통계', '비밀번호 변경'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap hover:opacity-60 ${tab === t ? 'border-b-2 border-black dark:border-white pb-1' : 'opacity-40'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === '데이터 편집' && (
        <div className="flex flex-col gap-2">
          <div className="mb-4">
            <button onClick={handleSaveData} className="w-full md:w-auto font-bold tracking-widest flex items-center justify-center gap-1 bg-black text-white dark:bg-white dark:text-black px-6 py-3 text-sm hover:opacity-80 transition-opacity">
              전체 저장하기 <ChevronRight size={16} />
            </button>
          </div>
          {renderDataSection("능력치", "stats")}
          {renderDataSection("이마젠", "familiar")}
          {renderDataSection("공용 패시브 스킬", "skill_passive")}
          {renderDataSection("공용 액티브 스킬", "skill_active")}
          {user.job && renderDataSection(`${user.job} 전용 스킬`, JOB_CATEGORY_MAP[user.job])}
        </div>
      )}

      {/* 커스텀 플로팅 창 (항목 추가 모달) */}
      {addModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setAddModal({ isOpen: false, categoryTitle: '', items: [] })}>
          <div className="bg-white dark:bg-[#111] p-6 w-full max-w-sm border border-black dark:border-white shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-4 uppercase">{addModal.categoryTitle} 추가</h3>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-2 pb-4">
              {addModal.items.map(m => (
                <button 
                  key={m.item_name} 
                  className={`border border-black/20 dark:border-white/20 p-2 text-xs font-bold text-center transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black ${getAttrColor(m.item_name)}`}
                  onClick={() => {
                    handleInput(m.item_name, '0');
                    setAddModal({ isOpen: false, categoryTitle: '', items: [] });
                  }}
                >
                  {m.item_name}
                </button>
              ))}
            </div>
            <button className="mt-2 bg-black text-white dark:bg-white dark:text-black font-bold p-3 text-sm tracking-widest" onClick={() => setAddModal({ isOpen: false, categoryTitle: '', items: [] })}>닫기</button>
          </div>
        </div>
      )}

      {tab === '점수' && (
        <div className="max-w-xl">
          <div className="border border-black/20 dark:border-white/20 p-6 md:p-8 mb-10 bg-black/5 dark:bg-white/5">
            <h3 className="text-sm font-bold mb-6">새 점수 기록하기</h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/2">
                <label className="text-xs opacity-60 font-bold block mb-2">목록 선택</label>
                <select value={scoreType} onChange={e=>setScoreType(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none font-bold text-sm">
                  <option value="" className="text-black">- 선택 -</option>
                  {scoreItems.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                </select>
              </div>
              <div className="w-full md:w-1/2">
                <label className="text-xs opacity-60 font-bold block mb-2">점수 기입</label>
                <input type="number" value={scoreVal} onChange={e=>setScoreVal(e.target.value)} placeholder="0" className="w-full bg-transparent border-b border-black dark:border-white py-2 focus:outline-none font-bold text-sm" />
              </div>
              <button onClick={handleAddScore} className="w-full md:w-auto bg-black text-white dark:bg-white dark:text-black font-bold px-6 py-2 text-sm mt-4 md:mt-0">추가</button>
            </div>
          </div>

          <h3 className="text-xs md:text-sm font-bold mb-4 opacity-60">과거 기록 (최신순)</h3>
          <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
            {scoreHistory.length === 0 && <p className="opacity-40 text-xs font-bold">기록된 점수가 없습니다.</p>}
            {scoreHistory.map((l, i) => (
              <div key={i} className="flex justify-between border-b border-black/10 dark:border-white/10 pb-2 text-xs md:text-sm font-bold">
                <div className="opacity-60">{new Date(l.timestamp).toLocaleDateString()}</div>
                <div>{l.item}</div>
                <div className="text-blue-600 dark:text-blue-400">{Number(l.value).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === '덱 설정' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <button onClick={addDeck} className="text-xs md:text-sm font-bold tracking-widest hover:opacity-60 border border-black dark:border-white px-3 py-2">+ 덱 추가</button>
            <button onClick={handleSaveDecks} className="text-xs md:text-sm font-bold tracking-widest bg-black text-white dark:bg-white dark:text-black px-4 py-2">덱 전체 저장</button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tempDecks.length === 0 && <p className="opacity-40 text-xs font-bold">생성된 덱이 없습니다.</p>}
            {tempDecks.map((deck) => (
              <div key={deck.deck_id} className="p-4 md:p-6 border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 relative group">
                <button onClick={() => setTempDecks(tempDecks.filter(d => d.deck_id !== deck.deck_id))} className="absolute top-4 md:top-6 right-4 md:right-6 opacity-40 hover:!opacity-100 transition-opacity text-red-500">
                  <Trash2 size={16} />
                </button>
                <input 
                  type="text" value={deck.name} onChange={(e) => updateDeck(deck.deck_id, 'name', e.target.value)}
                  className="bg-transparent text-base md:text-lg font-bold mb-6 w-3/4 focus:outline-none border-b border-black/20 focus:border-black dark:border-white/20 dark:focus:border-white"
                />
                
                <div className="space-y-4">
                  <div>
                    <span className="opacity-40 uppercase text-[10px] md:text-xs tracking-wider block mb-1 font-bold">이마젠</span>
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      {['f1', 'f2', 'f3'].map(k => <DeckSelect key={k} options={getSelectOptions('familiar')} val={deck[k]} onChange={(v)=>updateDeck(deck.deck_id, k, v)} />)}
                    </div>
                  </div>
                  <div>
                    <span className="opacity-40 uppercase text-[10px] md:text-xs tracking-wider block mb-1 font-bold">액티브 스킬</span>
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      {['a1', 'a2', 'a3'].map(k => <DeckSelect key={k} options={getSelectOptions('skill_active')} val={deck[k]} onChange={(v)=>updateDeck(deck.deck_id, k, v)} />)}
                    </div>
                  </div>
                  <div>
                    <span className="opacity-40 uppercase text-[10px] md:text-xs tracking-wider block mb-1 font-bold">패시브 스킬</span>
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
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
          <div className="mb-6 border-b border-black/20 dark:border-white/20 pb-2 inline-block">
            <select value={statItem} onChange={e=>setStatItem(e.target.value)} className="bg-transparent focus:outline-none text-base md:text-lg font-bold pr-4">
              <option value="전투력" className="text-black">전투력</option>
              {[...new Set(userLogs.map(l=>l.item))].filter(i=>i!=='전투력').map(s => <option key={s} value={s} className="text-black">{s}</option>)}
            </select>
          </div>
          <div className="h-48 md:h-64 w-full">
            <SimpleLineChart data={chartData} />
          </div>
        </div>
      )}

      {tab === '비밀번호 변경' && (
        <div className="max-w-md bg-black/5 dark:bg-white/5 p-6 border border-black/20 dark:border-white/20">
          <div className="flex flex-col gap-4">
            <input type="password" value={pw1} onChange={e=>setPw1(e.target.value)} placeholder="새 비밀번호 입력" className="bg-transparent border-b border-black/30 dark:border-white/30 py-2 focus:outline-none text-sm font-bold" />
            <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="새 비밀번호 확인" className="bg-transparent border-b border-black/30 dark:border-white/30 py-2 focus:outline-none text-sm font-bold" />
            <button onClick={handleChangePassword} className="bg-black text-white dark:bg-white dark:text-black px-6 py-3 font-bold text-sm mt-4 tracking-widest">변경하기</button>
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
  if (!data || data.length === 0) return <p className="text-xs font-bold opacity-40">해당 항목의 기록이 없습니다.</p>;
  if (data.length === 1) return <p className="text-xs font-bold opacity-40">최소 2개 이상의 기록이 필요합니다. (현재: {data[0].value})</p>;
  
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
            <text x={x} y={y - 10} fontSize="10" fontWeight="bold" fill="currentColor" textAnchor="middle" opacity="0.8">
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
        <p className="tracking-widest font-bold uppercase opacity-40">접근 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold tracking-widest mb-4">관리자 메뉴</h2>
      <p className="opacity-60 text-xs md:text-sm font-bold mb-8">
        길드장(MASTER), 운영진(ELITE), 관리자(ADMIN) 전용 시스템 대시보드.
      </p>
      <div className="border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 p-8 md:p-12 text-center opacity-60 text-xs md:text-sm font-bold">
        [ 길드원 관리 및 메타데이터 수정 기능은 추후 업데이트 예정입니다. ]<br/>
        현재 데이터 편집은 Google Sheet에서 직접 수행하시기 바랍니다.
      </div>
    </div>
  );
}
