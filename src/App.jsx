import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sun, Moon, Menu, X, ChevronRight, LogOut, Trash2 } from 'lucide-react';
import React from 'react';

// ==========================================
// CONFIGURATION
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbwzJC9fhOddcoOgYesXhA7SLyMP9qzaa1rZ_h_rE016B0CvAcdZCHB9PyscuAtKRPhA/exec"; 

const ATTR_COLORS = {
  '불': 'text-red-600 dark:text-red-400 font-bold',
  '물': 'text-blue-600 dark:text-blue-400 font-bold',
  '나무': 'text-green-600 dark:text-green-400 font-bold',
  '빛': 'text-yellow-600 dark:text-yellow-400 font-bold',
  '어둠': 'text-purple-600 dark:text-purple-400 font-bold',
};

const getAttrColor = (itemName, metadata) => {
  if (!itemName || !metadata) return '';
  const meta = metadata.find(m => m.item_name === itemName);
  if (meta && meta.attribute) {
    for (let key in ATTR_COLORS) {
      if (meta.attribute.includes(key)) return ATTR_COLORS[key];
    }
  }
  return '';
};

const getJobRowClass = (job) => {
  switch (job) {
    case '소드맨': return 'bg-[#C9DAF8] text-black border-black/10';
    case '위치': return 'bg-[#FCE5CD] text-black border-black/10';
    case '엔지니어': return 'bg-[#FFF2CC] text-black border-black/10';
    case '로그': return 'bg-[#D9EAD3] text-black border-black/10';
    case '디스트로이어': return 'bg-[#EAD1DC] text-black border-black/10';
    default: return 'border-b border-black/10 dark:border-white/10';
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

// 이마젠 수치 값 -> 숫자 변환 (차트용)
const parseValueForChart = (val) => {
  if (!val || val === 'X') return 0;
  const num = Number(val);
  if (!isNaN(num)) return num; // 0 ~ 10
  if (val.startsWith('초극')) return 20 + Number(val.replace('초극', ''));
  if (val.startsWith('초')) return 10 + Number(val.replace('초', ''));
  return 0;
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [dark, setDark] = useState(false);
  
  // LocalStorage Session
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('g_user')) || null);
  const [userData, setUserData] = useState(() => JSON.parse(localStorage.getItem('g_userData')) || {});
  const [userLogs, setUserLogs] = useState(() => JSON.parse(localStorage.getItem('g_userLogs')) || []);
  const [userDecks, setUserDecks] = useState(() => JSON.parse(localStorage.getItem('g_userDecks')) || []);
  const [metadata, setMetadata] = useState(() => JSON.parse(localStorage.getItem('g_metadata')) || []);
  const [familiarData, setFamiliarData] = useState(() => JSON.parse(localStorage.getItem('g_familiarData')) || []);
  
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(user ? 'personal' : 'sign'); 
  const [menuOpen, setMenuOpen] = useState(false);

  // Global Modal State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', options: [], onSelect: null });

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

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
    if (familiarData.length > 0) localStorage.setItem('g_familiarData', JSON.stringify(familiarData));
  }, [metadata, familiarData]);

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

  const openModal = (title, options, onSelect) => {
    setModalConfig({ isOpen: true, title, options, onSelect });
  };

  const closeModal = () => {
    setModalConfig({ isOpen: false, title: '', options: [], onSelect: null });
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
        if (isMounted && res) {
          if (res.metadata) setMetadata(res.metadata);
          if (res.familiar_data) setFamiliarData(res.familiar_data);
        }
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, [apiCall, metadata.length]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'dark' : ''}`}>
      <LoadingOverlay visible={loading} />
      
      {/* Global Selection Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white dark:bg-[#111] dark:text-white p-6 w-full max-w-sm border border-black dark:border-white shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-4 uppercase">{modalConfig.title}</h3>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-2 pb-4">
              {modalConfig.options.map(o => (
                <button 
                  key={o.value} 
                  className={`border border-black/20 dark:border-white/20 p-2 text-sm font-bold text-center transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black min-h-[48px] flex items-center justify-center break-words leading-tight ${o.colorClass || 'text-black dark:text-white'}`}
                  onClick={() => {
                    if(modalConfig.onSelect) modalConfig.onSelect(o.value);
                    closeModal();
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button className="mt-2 bg-black text-white dark:bg-white dark:text-black font-bold p-3 text-sm tracking-widest" onClick={closeModal}>닫기</button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white text-black dark:bg-[#111] dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <nav className="p-4 md:p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-black/10 dark:border-white/10">
          <div className="text-lg md:text-xl font-bold tracking-widest uppercase cursor-pointer" onClick={() => user && goPage('kingdom')}>
            버들별
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
              <div className="hidden md:flex items-center gap-6 text-sm tracking-wide font-bold">
                <button onClick={() => goPage('kingdom')} className={`hover:opacity-60 ${page === 'kingdom' ? 'underline underline-offset-4' : ''}`}>킹덤</button>
                <button onClick={() => goPage('personal')} className={`hover:opacity-60 ${page === 'personal' ? 'underline underline-offset-4' : ''}`}>마이페이지</button>
                <button onClick={() => goPage('password')} className={`hover:opacity-60 ${page === 'password' ? 'underline underline-offset-4' : ''}`}>비밀번호 변경</button>
                {['master', 'elite', 'admin', 'MASTER', 'ELITE', 'ADMIN'].includes(user.role) && (
                  <button onClick={() => goPage('manage')} className={`hover:opacity-60 ${page === 'manage' ? 'underline underline-offset-4' : ''}`}>관리</button>
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
            <button onClick={() => goPage('password')} className="text-left font-bold tracking-widest">비밀번호 변경</button>
            {['master', 'elite', 'admin', 'MASTER', 'ELITE', 'ADMIN'].includes(user.role) && (
              <button onClick={() => goPage('manage')} className="text-left font-bold tracking-widest">관리</button>
            )}
            <button onClick={logout} className="text-left font-bold tracking-widest text-red-500">로그아웃</button>
          </div>
        )}

        <main className="p-2 md:p-6 max-w-7xl mx-auto mt-2 pb-20">
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
                  metadata={metadata} familiarData={familiarData} apiCall={apiCall} openModal={openModal}
                />
              )}
              {page === 'password' && <PasswordPage user={user} apiCall={apiCall} goPage={goPage} />}
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
  const [sortConfig, setSortConfig] = useState({ key: 'cp', direction: 'desc' });

  const reqFamiliars = useMemo(() => metadata.filter(m => m.category === 'familiar' && Number(m.basic) === 1).map(m => m.item_name), [metadata]);
  const reqSkills = useMemo(() => metadata.filter(m => (m.category === 'skill_passive' || m.category === 'skill_active') && Number(m.basic) === 1).map(m => m.item_name), [metadata]);

  useEffect(() => {
    apiCall('get_kingdom').then(res => {
      if (res && res.data) setData(res.data);
    });
  }, [apiCall]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
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
      } else return 0;

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [data, sortConfig]);

  const Th = ({ label, sortKey, align='left', colorClass='' }) => (
    <th 
      onClick={() => sortKey && handleSort(sortKey)}
      className={`py-2 px-1 md:px-2 text-[11px] md:text-sm font-bold tracking-wider whitespace-nowrap border-b border-black dark:border-white text-${align} ${sortKey ? 'cursor-pointer hover:opacity-60' : ''} ${colorClass}`}
    >
      {label} {sortConfig.key === sortKey ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <div className="animate-fade-in px-2 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-widest">킹덤 멤버 현황</h2>
        <div className="flex gap-4 text-xs md:text-sm font-bold tracking-widest">
          <button onClick={() => setView('basic')} className={`hover:opacity-60 ${view === 'basic' ? 'border-b-2 border-black dark:border-white' : 'opacity-40'}`}>기본 정보</button>
          <button onClick={() => setView('familiar')} className={`hover:opacity-60 ${view === 'familiar' ? 'border-b-2 border-black dark:border-white' : 'opacity-40'}`}>이마젠</button>
          <button onClick={() => setView('skill')} className={`hover:opacity-60 ${view === 'skill' ? 'border-b-2 border-black dark:border-white' : 'opacity-40'}`}>스킬</button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 border border-black/10 dark:border-white/10">
        <table className="w-full text-[10px] md:text-sm text-left">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="w-4 border-b border-black dark:border-white py-2"></th> 
              <Th label="닉네임" sortKey="nickname" />
              {view === 'basic' && (
                <>
                  <Th label="직업" sortKey="job" />
                  <Th label="전투력" sortKey="cp" align="right" />
                </>
              )}
              {view === 'familiar' && reqFamiliars.map(f => <Th key={f} label={f} colorClass={getAttrColor(f, metadata)} />)}
              {view === 'skill' && reqSkills.map(s => <Th key={s} label={s} colorClass={getAttrColor(s, metadata)} />)}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={idx} className={`transition-colors ${getJobRowClass(row.job)}`}>
                <td className="py-2 px-1 text-[9px] md:text-xs text-center opacity-60 font-mono">{idx + 1}</td>
                <td className="py-2 px-1 md:px-2 whitespace-nowrap font-bold tracking-wide">{row.username}</td>
                {view === 'basic' && (
                  <>
                    <td className="py-2 px-1 md:px-2 whitespace-nowrap font-bold opacity-80">{row.job || '-'}</td>
                    <td className="py-2 px-1 md:px-2 whitespace-nowrap font-bold text-right tracking-wider">{Number(row.data['전투력'] || 0).toLocaleString()}</td>
                  </>
                )}
                {view === 'familiar' && reqFamiliars.map(f => (
                  <td key={f} className={`py-2 px-1 md:px-2 whitespace-nowrap font-bold opacity-90 ${getAttrColor(f, metadata)}`}>{row.data[f] || '-'}</td>
                ))}
                {view === 'skill' && reqSkills.map(s => (
                  <td key={s} className={`py-2 px-1 md:px-2 whitespace-nowrap font-bold opacity-90 ${getAttrColor(s, metadata)}`}>{row.data[s] || '-'}</td>
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
function PersonalPage({ user, setUser, userData, setUserData, userLogs, setUserLogs, userDecks, setUserDecks, metadata, familiarData, apiCall, openModal }) {
  const [tab, setTab] = useState('능력치');
  const [tempData, setTempData] = useState(userData);

  const myTabs = ['능력치', '이마젠', '공용 패시브 스킬', '공용 액티브 스킬'];
  if (user.job) myTabs.push(`${user.job} 전용 스킬`);
  myTabs.push('점수', '덱 설정', '통계');

  const handleInput = (item, val) => setTempData(prev => ({...prev, [item]: val}));

  const handleDeleteItem = (itemName) => {
    if (window.confirm(`${itemName} 항목을 삭제하시겠습니까?`)) {
      const newTemp = { ...tempData };
      delete newTemp[itemName];
      setTempData(newTemp);
    }
  };
  
  const handleSaveData = async () => {
    let logsToSave = [];
    Object.keys(tempData).forEach(key => {
      if (tempData[key] !== userData[key]) {
        logsToSave.push({ item: key, value: tempData[key] });
      }
    });

    Object.keys(userData).forEach(key => {
      if (tempData[key] === undefined && metadata.find(m => m.item_name === key && m.category !== 'score_type')) {
         logsToSave.push({ item: key, value: '' }); 
      }
    });

    if (logsToSave.length === 0) return alert("변경된 데이터가 없습니다.");

    const res = await apiCall('update_data', { username: user.username, logs: logsToSave });
    if (res) {
      alert("데이터가 성공적으로 저장되었습니다.");
      setUserData(tempData);
    }
  };

  const renderTableSection = (category, title) => {
    const items = metadata.filter(m => m.category === category);
    if (items.length === 0) return null;

    let cpItem = null;
    let otherItems = items;
    if (category === 'stats') {
      cpItem = items.find(m => m.item_name === '전투력');
      otherItems = items.filter(m => m.item_name !== '전투력');
    }

    const displayedItems = otherItems.filter(m => Number(m.basic) === 1 || tempData[m.item_name] !== undefined);
    const addableItems = otherItems.filter(m => Number(m.basic) === 0 && tempData[m.item_name] === undefined);

    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="flex justify-between items-end mb-2 border-b border-black/20 dark:border-white/20 pb-2">
          <h3 className="text-sm md:text-base tracking-widest font-bold uppercase">{title}</h3>
          <div className="flex gap-2">
            {addableItems.length > 0 && (
              <button 
                onClick={() => openModal(`${title} 항목 추가`, addableItems.map(m=>({label:m.item_name, value:m.item_name, colorClass:getAttrColor(m.item_name, metadata)})), (val) => handleInput(val, '0'))}
                className="text-xs md:text-sm font-bold border border-black dark:border-white px-3 py-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                + 항목 추가
              </button>
            )}
            <button onClick={handleSaveData} className="text-xs md:text-sm font-bold bg-black text-white dark:bg-white dark:text-black px-4 py-1 flex items-center gap-1 hover:opacity-80 transition-opacity">
              저장하기 <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {cpItem && (
          <table className="w-full border-collapse border border-black dark:border-white text-xs md:text-sm mb-4 bg-white dark:bg-[#111]">
            <tbody>
              <tr>
                <td className="border border-black dark:border-white px-2 py-1.5 w-1/2 bg-black/5 dark:bg-white/5 font-bold text-center tracking-widest">
                  {cpItem.item_name}
                </td>
                <td className="border border-black dark:border-white px-2 py-1 w-1/2">
                  <input
                    type="number"
                    value={tempData[cpItem.item_name] || ''}
                    onChange={(e) => handleInput(cpItem.item_name, e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent focus:outline-none text-center font-bold"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {displayedItems.length > 0 && (
          <table className="w-full border-collapse border border-black dark:border-white text-xs md:text-sm bg-white dark:bg-[#111]">
            <tbody>
              {displayedItems.map(m => (
                <tr key={m.item_name}>
                  <td className={`border border-black dark:border-white px-2 py-1.5 w-1/2 bg-black/5 dark:bg-white/5 font-bold ${getAttrColor(m.item_name, metadata)}`}>
                    {m.item_name}
                  </td>
                  <td className="border border-black dark:border-white px-2 py-0.5 w-1/2 relative group">
                    <div className="flex items-center justify-between w-full h-full pr-6">
                      <input
                        type="text"
                        value={tempData[m.item_name] || ''}
                        onChange={(e) => handleInput(m.item_name, e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent focus:outline-none text-center font-bold"
                      />
                    </div>
                    {Number(m.basic) === 0 && (
                      <button 
                        onClick={() => handleDeleteItem(m.item_name)} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 opacity-20 hover:opacity-100 transition-opacity"
                        title="항목 삭제"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const renderFamiliarSection = () => {
    const familiarMeta = metadata.filter(m => m.category === 'familiar');
    const addableItems = familiarMeta.filter(m => Number(m.basic) === 0 && tempData[m.item_name] === undefined);

    // [버그 수정됨] 0이 false로 처리되지 않도록 String 변환
    const getPowerLevel = (val) => {
      if (val === undefined || val === null || val === '') return 'X';
      const strVal = String(val).trim();
      
      if (strVal === 'X') return 'X';
      if (strVal.startsWith('초극')) return '초극';
      if (strVal.startsWith('초')) return '초월';
      return '일반';
    };

    const getFamiliarOptions = (itemName) => {
      const defaultOptions = ['X'];
      for(let i=0; i<=10; i++) defaultOptions.push(i.toString());
      for(let i=1; i<=10; i++) defaultOptions.push(`초${i}`);
      for(let i=1; i<=10; i++) defaultOptions.push(`초극${i}`);

      if (!familiarData || familiarData.length === 0) return defaultOptions;

      // 공백 이슈 방지를 위해 모두 trim() 적용
      const fd = familiarData.filter(d => String(d.familiar).trim() === String(itemName).trim());
      if(fd.length === 0) return defaultOptions; 

      const options = ['X'];
      if (fd.some(d => String(d.power).trim() === '일반' && d.url)) {
        for(let i=0; i<=10; i++) options.push(i.toString());
      }
      if (fd.some(d => String(d.power).trim() === '초월' && d.url)) {
        for(let i=1; i<=10; i++) options.push(`초${i}`);
      }
      if (fd.some(d => String(d.power).trim() === '초극' && d.url)) {
        for(let i=1; i<=10; i++) options.push(`초극${i}`);
      }
      return options;
    };

    // 공백 이슈 방지를 위해 모두 trim() 적용하여 매칭
    const getFamiliarImageUrl = (itemName, powerLevel) => {
      if (!familiarData || familiarData.length === 0) return '';
      const record = familiarData.find(d => 
        String(d.familiar).trim() === String(itemName).trim() && 
        String(d.power).trim() === String(powerLevel).trim()
      );
      return record && record.url ? String(record.url).trim() : '';
    };

    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-end mb-2 border-b border-black/20 dark:border-white/20 pb-2">
          <h3 className="text-sm md:text-base tracking-widest font-bold uppercase">이마젠</h3>
          <div className="flex gap-2">
             {addableItems.length > 0 && (
              <button 
                onClick={() => openModal(`이마젠 추가`, addableItems.map(m=>({label:m.item_name, value:m.item_name, colorClass:getAttrColor(m.item_name, metadata)})), (val) => handleInput(val, 'X'))}
                className="text-xs md:text-sm font-bold border border-black dark:border-white px-3 py-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                + 이마젠 추가
              </button>
            )}
            <button onClick={handleSaveData} className="text-xs md:text-sm font-bold bg-black text-white dark:bg-white dark:text-black px-4 py-1 flex items-center gap-1 hover:opacity-80 transition-opacity">
              저장하기 <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {['불', '물', '나무', '빛', '어둠'].map(attr => {
            const items = familiarMeta.filter(m => m.attribute && m.attribute.includes(attr));
            const displayedItems = items.filter(m => Number(m.basic) === 1 || tempData[m.item_name] !== undefined);
            
            if (displayedItems.length === 0) return null;

            return (
              <div key={attr} className="w-full">
                <h4 className={`text-sm md:text-base font-bold mb-2 tracking-widest ${ATTR_COLORS[attr]}`}>{attr} 속성</h4>
                <div className="grid grid-cols-4 border-t border-l border-black dark:border-white bg-white dark:bg-[#111]">
                  {displayedItems.map(m => {
                    const val = tempData[m.item_name] !== undefined ? tempData[m.item_name] : 'X';
                    const powerLevel = getPowerLevel(val);
                    const imgUrl = getFamiliarImageUrl(m.item_name, powerLevel);
                    const options = getFamiliarOptions(m.item_name);

                    return (
                      <div key={m.item_name} className="border-b border-r border-black dark:border-white flex flex-col group relative">
                        {/* 1행: 이름 */}
                        <div className={`text-center font-bold text-[9px] md:text-[11px] py-1 border-b border-black/20 dark:border-white/20 truncate px-1 bg-black/5 dark:bg-white/5 ${getAttrColor(m.item_name, metadata)}`}>
                           {m.item_name}
                           {Number(m.basic) === 0 && (
                              <button onClick={() => handleDeleteItem(m.item_name)} className="absolute top-1 right-1 text-red-500 opacity-20 hover:opacity-100"><X size={10}/></button>
                           )}
                        </div>
                        {/* 2행: 이미지 */}
                        <div className="flex-1 flex items-center justify-center bg-black/5 dark:bg-white/5 overflow-hidden">
                          {imgUrl ? (
                            <img src={imgUrl} alt={m.item_name} className="w-full h-auto aspect-[214/236] object-cover mix-blend-multiply dark:mix-blend-normal" />
                          ) : (
                            <div className="w-full aspect-[214/236] flex items-center justify-center text-[9px] opacity-40 font-bold bg-white dark:bg-black/50">
                              No Image
                            </div>
                          )}
                        </div>
                        {/* 3행: 수치 드롭다운 */}
                        <div className="border-t border-black/20 dark:border-white/20 bg-white dark:bg-[#111]">
                          <select 
                            value={val} 
                            onChange={(e) => handleInput(m.item_name, e.target.value)}
                            className="w-full bg-transparent text-center text-[10px] md:text-xs py-1 focus:outline-none cursor-pointer font-bold dark:text-white"
                            style={{ textAlignLast: 'center' }}
                          >
                            {options.map(opt => <option key={opt} value={opt} className="text-black bg-white">{opt}</option>)}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  // --- SCORE ---
  const [scoreType, setScoreType] = useState('');
  const [scoreVal, setScoreVal] = useState('');

  const handleAddScore = async () => {
    if (!scoreType || !scoreVal) return alert("종류와 점수를 기입해주세요.");
    const ts = new Date().toISOString();
    const res = await apiCall('update_data', { username: user.username, logs: [{ item: scoreType, value: scoreVal, timestamp: ts }] });
    if (res) {
      alert("점수가 기록되었습니다.");
      setScoreVal('');
      setUserLogs([...userLogs, { timestamp: ts, item: scoreType, value: scoreVal }]);
    }
  };

  const handleDeleteLog = async (log) => {
    if(!window.confirm("이 기록을 삭제하시겠습니까?")) return;
    const res = await apiCall('delete_log', { username: user.username, item: log.item, timestamp: log.timestamp });
    if (res) {
      setUserLogs(userLogs.filter(l => l.timestamp !== log.timestamp || l.item !== log.item));
    }
  };

  const scoreMetaOptions = metadata.filter(m => m.category === 'score_type').map(m => ({ label: m.item_name, value: m.item_name }));
  const scoreItems = scoreMetaOptions.map(m => m.value);
  const scoreHistory = userLogs.filter(l => scoreItems.includes(l.item)).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  // --- DECKS ---
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

  const getDeckOptions = (category) => {
    let list = metadata.filter(m => m.category === category).map(m => m.item_name);
    if (category === 'skill_active' && user.job && JOB_CATEGORY_MAP[user.job]) {
      const jobSkills = metadata.filter(m => m.category === JOB_CATEGORY_MAP[user.job]).map(m => m.item_name);
      list = [...list, ...jobSkills];
    }
    return list.map(opt => ({
      label: `${opt} ${userData[opt] ? `(${userData[opt]})` : ''}`,
      value: opt,
      colorClass: getAttrColor(opt, metadata)
    }));
  };

  // --- STATS ---
  const [chartSel, setChartSel] = useState({
    score: scoreHistory.length > 0 ? scoreHistory[0].item : '',
    stat: '',
    other: ''
  });

  const updateChartSel = (field, val) => setChartSel(prev => ({...prev, [field]: val}));

  const allStatItems = metadata.filter(m => m.category === 'stats' && m.item_name !== '전투력').map(m => m.item_name);
  const statHistory = userLogs.filter(l => allStatItems.includes(l.item));
  if(!chartSel.stat && statHistory.length > 0) updateChartSel('stat', statHistory[0].item);

  const allOtherItems = metadata.filter(m => !['score_type', 'stats'].includes(m.category)).map(m => m.item_name);
  const otherHistory = userLogs.filter(l => allOtherItems.includes(l.item));
  if(!chartSel.other && otherHistory.length > 0) updateChartSel('other', otherHistory[0].item);

  return (
    <div className="animate-fade-in px-2 md:px-0">
      <h2 className="text-2xl md:text-3xl font-bold tracking-widest mb-1">{user.username}</h2>
      <p className="opacity-60 text-xs md:text-sm font-bold mb-8 tracking-widest">{user.role} / {user.job}</p>

      {/* 동적 탭 메뉴 */}
      <div className="flex gap-4 md:gap-8 text-xs md:text-sm font-bold tracking-widest mb-8 border-b border-black/20 dark:border-white/20 pb-2 overflow-x-auto">
        {myTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap hover:opacity-60 ${tab === t ? 'border-b-2 border-black dark:border-white pb-1' : 'opacity-40'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto md:mx-0">
        {tab === '능력치' && renderTableSection('stats', '능력치 편집')}
        {tab === '이마젠' && renderFamiliarSection()}
        {tab === '공용 패시브 스킬' && renderTableSection('skill_passive', '공용 패시브 스킬 편집')}
        {tab === '공용 액티브 스킬' && renderTableSection('skill_active', '공용 액티브 스킬 편집')}
        {user.job && tab === `${user.job} 전용 스킬` && renderTableSection(JOB_CATEGORY_MAP[user.job], `${user.job} 전용 스킬 편집`)}

        {tab === '점수' && (
          <div className="max-w-xl animate-fade-in">
            <div className="border border-black/20 dark:border-white/20 p-6 md:p-8 mb-10 bg-black/5 dark:bg-white/5">
              <h3 className="text-sm font-bold mb-6">새 점수 기록하기</h3>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/2">
                  <label className="text-xs opacity-60 font-bold block mb-2">목록 선택</label>
                  <button 
                    onClick={() => openModal('점수 목록', scoreMetaOptions, (val) => setScoreType(val))}
                    className="w-full text-left bg-transparent border-b border-black dark:border-white py-2 font-bold text-sm"
                  >
                    {scoreType || '- 선택 -'}
                  </button>
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
                <div key={i} className="flex justify-between items-center border-b border-black/10 dark:border-white/10 pb-2 text-xs md:text-sm font-bold group">
                  <div className="opacity-60">{new Date(l.timestamp).toLocaleDateString()}</div>
                  <div className="flex-grow text-center">{l.item}</div>
                  <div className="text-blue-600 dark:text-blue-400 mr-4">{Number(l.value).toLocaleString()}</div>
                  <button onClick={() => handleDeleteLog(l)} className="text-red-500 opacity-20 hover:opacity-100 transition-opacity"><X size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === '덱 설정' && (
          <div className="animate-fade-in">
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
                        {['f1', 'f2', 'f3'].map(k => (
                          <button key={k} onClick={() => openModal('이마젠 선택', getDeckOptions('familiar'), (val) => updateDeck(deck.deck_id, k, val))} className={`border-b border-black/20 dark:border-white/20 py-1 text-left text-xs md:text-sm font-bold truncate ${getAttrColor(deck[k], metadata)}`}>
                            {deck[k] || '- 미착용 -'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="opacity-40 uppercase text-[10px] md:text-xs tracking-wider block mb-1 font-bold">액티브 스킬</span>
                      <div className="grid grid-cols-3 gap-2 md:gap-4">
                        {['a1', 'a2', 'a3'].map(k => (
                          <button key={k} onClick={() => openModal('액티브 스킬 선택', getDeckOptions('skill_active'), (val) => updateDeck(deck.deck_id, k, val))} className={`border-b border-black/20 dark:border-white/20 py-1 text-left text-xs md:text-sm font-bold truncate ${getAttrColor(deck[k], metadata)}`}>
                            {deck[k] || '- 미착용 -'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="opacity-40 uppercase text-[10px] md:text-xs tracking-wider block mb-1 font-bold">패시브 스킬</span>
                      <div className="grid grid-cols-3 gap-2 md:gap-4">
                        {['p1', 'p2', 'p3'].map(k => (
                          <button key={k} onClick={() => openModal('패시브 스킬 선택', getDeckOptions('skill_passive'), (val) => updateDeck(deck.deck_id, k, val))} className={`border-b border-black/20 dark:border-white/20 py-1 text-left text-xs md:text-sm font-bold truncate ${getAttrColor(deck[k], metadata)}`}>
                            {deck[k] || '- 미착용 -'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === '통계' && (
          <div className="max-w-3xl space-y-12 animate-fade-in">
            <div>
              <h3 className="text-base font-bold mb-4 border-b border-black/20 dark:border-white/20 inline-block pb-1">전투력</h3>
              <div className="h-40 md:h-56 w-full">
                <SimpleLineChart data={userLogs.filter(l => l.item === '전투력').sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))} />
              </div>
            </div>

            {scoreHistory.length > 0 && (
              <div>
                <div className="mb-4">
                  <button onClick={() => openModal('점수 항목', scoreMetaOptions, (val) => updateChartSel('score', val))} className="text-base font-bold border-b border-black/20 dark:border-white/20 pb-1 hover:opacity-60 transition-opacity">
                    점수: {chartSel.score || '선택'} ▼
                  </button>
                </div>
                <div className="h-40 md:h-56 w-full">
                  <SimpleLineChart data={userLogs.filter(l => l.item === chartSel.score).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))} />
                </div>
              </div>
            )}

            {statHistory.length > 0 && (
              <div>
                <div className="mb-4">
                  <button onClick={() => openModal('능력치 항목', [...new Set(statHistory.map(l=>l.item))].map(i => ({label:i, value:i})), (val) => updateChartSel('stat', val))} className="text-base font-bold border-b border-black/20 dark:border-white/20 pb-1 hover:opacity-60 transition-opacity">
                    능력치: {chartSel.stat || '선택'} ▼
                  </button>
                </div>
                <div className="h-40 md:h-56 w-full">
                  <SimpleLineChart data={userLogs.filter(l => l.item === chartSel.stat).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))} />
                </div>
              </div>
            )}

            {otherHistory.length > 0 && (
              <div>
                <div className="mb-4">
                  <button onClick={() => openModal('기타 항목', [...new Set(otherHistory.map(l=>l.item))].map(i => ({label:i, value:i})), (val) => updateChartSel('other', val))} className="text-base font-bold border-b border-black/20 dark:border-white/20 pb-1 hover:opacity-60 transition-opacity">
                    이마젠/스킬 등: {chartSel.other || '선택'} ▼
                  </button>
                </div>
                <div className="h-40 md:h-56 w-full">
                  <SimpleLineChart data={userLogs.filter(l => l.item === chartSel.other).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. PASSWORD PAGE (Separated from Personal)
// ==========================================
function PasswordPage({ user, apiCall, goPage }) {
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  
  const handleChangePassword = async () => {
    if (!pw1 || pw1 !== pw2) return alert("비밀번호가 일치하지 않거나 비어있습니다.");
    const hashedPwd = await hashPassword(pw1);
    const res = await apiCall('update_password', { username: user.username, password_hash: hashedPwd });
    if (res) {
      alert("비밀번호가 성공적으로 변경되었습니다.");
      setPw1(''); setPw2('');
      goPage('personal');
    }
  };

  return (
    <div className="animate-fade-in px-2 md:px-0 max-w-md mt-10">
      <h2 className="text-xl md:text-2xl font-bold tracking-widest mb-6 border-b border-black/20 dark:border-white/20 pb-2">비밀번호 변경</h2>
      <div className="bg-black/5 dark:bg-white/5 p-6 border border-black/20 dark:border-white/20">
        <div className="flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold opacity-60 block mb-1">새 비밀번호</label>
            <input type="password" value={pw1} onChange={e=>setPw1(e.target.value)} placeholder="입력" className="w-full bg-transparent border-b border-black/30 dark:border-white/30 py-2 focus:outline-none focus:border-black dark:focus:border-white text-sm font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold opacity-60 block mb-1">새 비밀번호 확인</label>
            <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="재입력" className="w-full bg-transparent border-b border-black/30 dark:border-white/30 py-2 focus:outline-none focus:border-black dark:focus:border-white text-sm font-bold" />
          </div>
          <button onClick={handleChangePassword} className="bg-black text-white dark:bg-white dark:text-black px-6 py-3 font-bold text-sm mt-4 tracking-widest hover:opacity-80 transition-opacity">변경하기</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SVG CHART COMPONENT
// ==========================================
function SimpleLineChart({ data }) {
  if (!data || data.length === 0) return <p className="text-xs font-bold opacity-40">해당 항목의 기록이 없습니다.</p>;
  if (data.length === 1) return <p className="text-xs font-bold opacity-40">최소 2개 이상의 기록이 필요합니다. (현재: {data[0].value})</p>;
  
  const values = data.map(d => parseValueForChart(d.value));
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const diff = maxVal - minVal || 1;
  
  const width = 800;
  const height = 200;
  const pad = 20;

  const points = data.map((d, i) => {
    const x = pad + (i * ((width - pad * 2) / (data.length - 1)));
    const y = height - pad - ((parseValueForChart(d.value) - minVal) / diff) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="currentColor" strokeOpacity="0.2" />
      <line x1={pad} y1={pad} x2={width-pad} y2={pad} stroke="currentColor" strokeOpacity="0.2" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
      {data.map((d, i) => {
        const x = pad + (i * ((width - pad * 2) / (data.length - 1)));
        const y = height - pad - ((parseValueForChart(d.value) - minVal) / diff) * (height - pad * 2);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="currentColor" />
            <text x={x} y={y - 10} fontSize="10" fontWeight="bold" fill="currentColor" textAnchor="middle" opacity="0.8">
              {d.value} {/* 원래 텍스트(예: 초1)를 표시 */}
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
// 5. MANAGE PAGE
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
    <div className="animate-fade-in px-2 md:px-0">
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
