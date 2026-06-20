let monitorDataCache = null;

// 從九巴 API 獲取資料
async function fetchBusETA(stopId, route) {
    try {
        const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stopId}`);
        const data = await response.json();
        return data.data.filter(item => item.route === route);
    } catch (error) {
        console.error(`讀取站點 ${stopId} 路線 ${route} 失敗:`, error);
        return [];
    }
}

// 核心資料更新（不再處理倒數，單純抓取網路數據）
async function refreshDataFromAPI() {
    const stationGroups = [
        {
            stopName: '日景樓 (YAT KING HOUSE)',
            routes: [{ stopId: '6E6EBC9D1AF2DA52', route: '46X' }]
        },
        {
            stopName: '城門隧道轉車站 (SHING MUN TUNNEL)',
            routes: [
                { stopId: '81B719F7DC3F0FAD', route: '46X' },
                { stopId: '9E8E99C5BB698AC2', route: '48X' },
                { stopId: '9E8E99C5BB698AC2', route: '269D' },
                { stopId: 'C8276DF869656712', route: '40X' }
            ]
        }
    ];

    const newData = [];
    for (const group of stationGroups) {
        const groupBuses = [];
        for (const r of group.routes) {
            const busData = await fetchBusETA(r.stopId, r.route);
            groupBuses.push({ route: r.route, busData });
        }
        newData.push({ stopName: group.stopName, routesData: groupBuses });
    }
    monitorDataCache = newData;
}

// 核心大腦與畫面渲染
function renderInterface() {
    const appContainer = document.getElementById('app');
    if (!monitorDataCache) return;

    // ================== 🧠 智能對接與尋車 ==================
    let myCarArrivalAtShingMunTime = null;
    let shingMunMy46XEtaString = null; 

    const yatKingGroup = monitorDataCache.find(g => g.stopName.includes('日景樓'));
    const shingMunGroup = monitorDataCache.find(g => g.stopName.includes('城門隧道'));

    if (yatKingGroup && shingMunGroup) {
        const yk46xRoute = yatKingGroup.routesData.find(r => r.route === '46X');
        const sm46xRoute = shingMunGroup.routesData.find(r => r.route === '46X');

        if (yk46xRoute && yk46xRoute.busData[0] && sm46xRoute && sm46xRoute.busData) {
            const ykFirstBusEta = new Date(yk46xRoute.busData[0].eta).getTime();
            
            // 動態追蹤：日景樓開出時間 + 13分鐘合理車程
            const estimatedShingMunTime = ykFirstBusEta + (13 * 60 * 1000); 

            let minDiff = Infinity;
            let targetBus = null;

            sm46xRoute.busData.forEach(bus => {
                if (bus.eta) {
                    const busTime = new Date(bus.eta).getTime();
                    const diff = Math.abs(busTime - estimatedShingMunTime);
                    // 必須比日景樓到站時間晚，才是你正坐在上面的那班車
                    if (diff < minDiff && busTime > ykFirstBusEta) {
                        minDiff = diff;
                        targetBus = bus;
                    }
                }
            });

            if (targetBus) {
                myCarArrivalAtShingMunTime = new Date(targetBus.eta);
                shingMunMy46XEtaString = targetBus.eta; 
            } else {
                myCarArrivalAtShingMunTime = new Date(estimatedShingMunTime);
            }
        }
    }

    // 🏎️ 轉乘爭霸賽：只塞入真正有效的「未來班次」
    let validTransferBuses = [];
    const myTargetTime = myCarArrivalAtShingMunTime ? myCarArrivalAtShingMunTime.getTime() : 0;

    if (shingMunGroup && myTargetTime > 0) {
        ['48X', '269D', '40X'].forEach(targetRoute => {
            const rData = shingMunGroup.routesData.find(r => r.route === targetRoute);
            if (rData && rData.busData) {
                rData.busData.forEach(bus => {
                    if (bus.eta) {
                        const busTime = new Date(bus.eta).getTime();
                        // 轉乘車的時間必須大於（或等於減去30秒步行誤差）你下車的時間
                        if (busTime >= myTargetTime - 30000) {
                            validTransferBuses.push({
                                route: targetRoute,
                                etaString: bus.eta,
                                time: busTime
                            });
                        }
                    }
                });
            }
        });
    }

    // 排序有效班次：近的在前
    validTransferBuses.sort((a, b) => a.time - b.time);
    let globalRedBus = validTransferBuses[0] || null;
    let globalYellowBus = validTransferBuses[1] || null;
    // ============================================================

    let htmlTemplate = '';

    // 1. 渲染 日景樓 區塊
    if (yatKingGroup) {
        htmlTemplate += `<div class="station-group-title">📍 ${yatKingGroup.stopName}</div>`;
        htmlTemplate += renderBusRows(yatKingGroup.routesData, '日景樓', shingMunMy46XEtaString, globalRedBus, globalYellowBus);
    }

    // 2. 渲染 城門隧道轉車站 區塊
    if (shingMunGroup) {
        htmlTemplate += `<div class="station-group-title">📍 ${shingMunGroup.stopName}</div>`;
        
        const sm46xData = shingMunGroup.routesData.filter(r => r.route === '46X');
        const transferRoutesData = shingMunGroup.routesData.filter(r => ['48X', '269D', '40X'].includes(r.route));

        // 46X 永遠置頂在城隧的第一行
        htmlTemplate += renderBusRows(sm46xData, '城門隧道', shingMunMy46XEtaString, globalRedBus, globalYellowBus);

        // 轉乘線 (48X, 269D, 40X) 複製並進行動態排序，防止污染快取
        const sortedTransferRoutes = [...transferRoutesData].sort((routeA, routeB) => {
            const validBusA = routeA.busData.find(b => b.eta && new Date(b.eta).getTime() >= myTargetTime - 30000);
            const validBusB = routeB.busData.find(b => b.eta && new Date(b.eta).getTime() >= myTargetTime - 30000);

            const timeA = validBusA ? new Date(validBusA.eta).getTime() : Infinity;
            const timeB = validBusB ? new Date(validBusB.eta).getTime() : Infinity;
            
            return timeA - timeB; 
        });

        htmlTemplate += renderBusRows(sortedTransferRoutes, '城門隧道', shingMunMy46XEtaString, globalRedBus, globalYellowBus);
    }

    appContainer.innerHTML = htmlTemplate;
}

// 輔助渲染 HTML 行
function renderBusRows(routesData, stationType, shingMunMy46XEtaString, globalRedBus, globalYellowBus) {
    let html = '';
    for (const busItem of routesData) {
        const route = busItem.route;
        const busData = busItem.busData;

        if (busData && busData.length > 0) {
            const destName = busData[0].dest_tc;

            const timeList = busData.slice(0, 3).map((bus, index) => {
                if (!bus.eta) return "---";
                
                const eta = new Date(bus.eta);
                const now = new Date();
                const totalSeconds = Math.floor((eta - now) / 1000);
                
                let timeText = totalSeconds <= 0 ? "即將" : `${Math.floor(totalSeconds / 60)}分${(totalSeconds % 60).toString().padStart(2, '0')}秒`;

                let isRedBlink = false;
                let isYellowBlink = false;

                if (stationType === '日景樓') {
                    if (index === 0) isRedBlink = true; 
                } else if (stationType === '城門隧道') {
                    if (route === '46X') {
                        if (shingMunMy46XEtaString && bus.eta === shingMunMy46XEtaString) {
                            isRedBlink = true; 
                        }
                    } else {
                        if (globalRedBus && globalRedBus.route === route && bus.eta === globalRedBus.etaString) {
                            isRedBlink = true;
                        } else if (globalYellowBus && globalYellowBus.route === route && bus.eta === globalYellowBus.etaString) {
                            isYellowBlink = true;
                        }
                    }
                }

                if (isRedBlink) {
                    return `<span style="color: #ef4444; font-weight: 900; animation: pulse 1s infinite;">${timeText}</span>`;
                } else if (isYellowBlink) {
                    return `<span style="color: #facc15; font-weight: 900; animation: pulse 1s infinite;">${timeText}</span>`;
                } else {
                    return `<span style="color: #64748b; font-weight: 500;">${timeText}</span>`;
                }
            });

            const timesString = timeList.join(' <span style="color: #334155;">➔</span> ');

            html += `
                <div class="bus-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="bus-id">${route}</span>
                            <span class="bus-destination">往 ${destName}</span>
                        </div>
                        <div class="bus-time">${timesString}</div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="bus-card" style="opacity: 0.4;">
                    <div style="display: flex; justify-content: space-between;">
                        <span class="bus-id">${route}</span>
                        <span style="color: #64748b; font-size: 14px;">暫無即時班次資料</span>
                    </div>
                </div>
            `;
        }
    }
    return html;
}

// 每秒鐘單純重新渲染畫面（計算新的剩餘分秒），每 30 秒向九巴 API 索取最新時間線
let fetchCounter = 0;
async function tick() {
    if (fetchCounter <= 0 || monitorDataCache === null) {
        fetchCounter = 30; // 重設為 30 秒抓取一次網路
        await refreshDataFromAPI();
    }
    fetchCounter--;
    renderInterface();
}

async function init() {
    await tick();
    setInterval(tick, 1000); // 啟動每秒時鐘
}

init();