const ATPT_OFCDC_SC_CODE = 'B10';
const SD_SCHUL_CODE = '7010703';

// 상용 알레르기 유발 식품 19종 매핑
const ALLERGY_MAP = {
    "1": "난류", "2": "우유", "3": "메밀", "4": "땅콩", "5": "대두", 
    "6": "밀", "7": "고등어", "8": "게", "9": "새우", "10": "돼지고기", 
    "11": "복숭아", "12": "토마토", "13": "아황산염", "14": "호두", 
    "15": "닭고기", "16": "쇠고기", "17": "오징어", "18": "조개류", "19": "잣"
};

let currentMonth = new Date(); // 현재 렌더링 중인 "월" 객체
currentMonth.setDate(1); // 달력 계산 편해지도록 1일로 세팅

function getEmojiForFood(foodName) {
    if (/(밥|비빔밥|볶음밥|덮밥|리조또|마끼|오므라이스)/.test(foodName)) return '🍚';
    if (/(국|탕|찌개|스프|전골|해장국|수제비|미역국|무국)/.test(foodName)) return '🍲';
    if (/(돈육|돼지|삼겹|보쌈|제육|수육|동파육|족발|고기|베이컨)/.test(foodName)) return '🍖';
    if (/(소고기|쇠고기|스테이크|불고기|함박|갈비|우삼겹|차돌)/.test(foodName)) return '🥩';
    if (/(닭|치킨|강정|삼계탕|백숙|찜닭|유린기)/.test(foodName)) return '🍗';
    if (/(생선|고등어|삼치|갈치|가자미|연어|조기|꽁치|코다리|동태|명태|낙지|오징어|주꾸미|새우|회|초밥)/.test(foodName)) return '🐟';
    if (/(김치|깍두기|단무지|겉절이|동치미|석박지)/.test(foodName)) return '🌶️';
    if (/(나물|무침|채소|샐러드|시금치|콩나물|고사리|숙주|야채|파절이|상추|묵)/.test(foodName)) return '🥗';
    if (/(면|우동|국수|스파게티|파스타|라면|짜장|짬뽕|소바|냉면|당면|쫄면)/.test(foodName)) return '🍜';
    if (/(빵|토스트|샌드위치|모닝빵|바게트|베이글|크로와상|케이크|마카롱|디저트|파이)/.test(foodName)) return '🍞';
    if (/(과일|사과|바나나|포도|오렌지|귤|수박|딸기|멜론|파인애플|키위)/.test(foodName)) return '🍎';
    if (/(떡|인절미|가래떡|백설기|절편|송편)/.test(foodName)) return '🍡';
    if (/(튀김|돈까스|새우튀김|감자튀김|너겟|텐더|고로케|핫도그|만두|탕수육|꿔바로우)/.test(foodName)) return '🍤';
    if (/(우유|요거트|요구르트|주스|음료|에이드|식혜|수정과)/.test(foodName)) return '🥛';
    if (/(피자)/.test(foodName)) return '🍕';
    if (/(버거)/.test(foodName)) return '🍔';
    if (/(카레|커리)/.test(foodName)) return '🍛';
    if (/(계란|달걀|계란말이|계란찜|후라이)/.test(foodName)) return '🍳';
    if (/(김구이|김자반)/.test(foodName)) return '🍙';
    
    return '🍽️'; // 기본 이모지
}

const monthDisplay = document.getElementById('monthDisplay');
const yearDisplay = document.getElementById('yearDisplay');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const todayBtn = document.getElementById('todayBtn');
const calendarGrid = document.getElementById('calendarGrid');
const loader = document.getElementById('loader');
const calendarContainer = document.getElementById('calendarContainer');

document.addEventListener('DOMContentLoaded', () => {
    updateView();
    
    prevBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        updateView();
    });
    
    nextBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        updateView();
    });
    
    todayBtn.addEventListener('click', () => {
        currentMonth = new Date();
        currentMonth.setDate(1);
        updateView();
    });
});

function updateView() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    monthDisplay.textContent = `${month}월`;
    yearDisplay.textContent = `${year}년`;
    
    buildCalendar();
}

function getFormattedDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const date = String(dateObj.getDate()).padStart(2, '0');
    return `${year}${month}${date}`;
}

async function buildCalendar() {
    calendarContainer.classList.add('hidden');
    loader.classList.remove('hidden');
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 이 달의 1일
    const firstDay = new Date(year, month, 1);
    // 이 달의 마지막 날
    const lastDay = new Date(year, month + 1, 0);
    
    // 달력의 시작일 (일요일부터 시작하게)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); 
    
    // 달력의 종료일 (토요일로 끝나게)
    const endDate = new Date(lastDay);
    if(endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }
    
    const MLSV_FROM_YMD = getFormattedDate(startDate);
    const MLSV_TO_YMD = getFormattedDate(endDate);
    
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_FROM_YMD=${MLSV_FROM_YMD}&MLSV_TO_YMD=${MLSV_TO_YMD}`;
    
    let mealDict = {};
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.mealServiceDietInfo) {
            const meals = data.mealServiceDietInfo[1].row;
            meals.forEach(meal => {
                const dateKey = meal.MLSV_YMD; // "YYYYMMDD"
                if (!mealDict[dateKey]) mealDict[dateKey] = [];
                mealDict[dateKey].push(meal);
            });
        }
    } catch (error) {
        console.error("Error fetching meal data:", error);
    }
    
    // 그리드 렌더링
    calendarGrid.innerHTML = '';
    
    let currentIterDate = new Date(startDate);
    const todayStr = getFormattedDate(new Date());
    
    while (currentIterDate <= endDate) {
        const dayDiv = document.createElement('div');
        const dateKey = getFormattedDate(currentIterDate);
        const isCurrentMonth = currentIterDate.getMonth() === month;
        const dayOfWeek = currentIterDate.getDay();
        
        dayDiv.className = 'calendar-day';
        if (!isCurrentMonth) dayDiv.classList.add('other-month');
        if (dateKey === todayStr) dayDiv.classList.add('today');
        
        let dayColorAttr = '';
        if (dayOfWeek === 0) dayColorAttr = 'style="color: #ff6b6b;"';
        else if (dayOfWeek === 6) dayColorAttr = 'style="color: #5bc0eb;"';

        const dayNumberHtml = `<div class="day-number">
             <span ${dayColorAttr}>${currentIterDate.getDate()}</span>
             ${dateKey === todayStr ? '<span style="font-size:0.7rem; background:var(--accent-color); color:var(--bg-color); padding: 2px 6px; border-radius: 8px;">오늘</span>' : ''}
        </div>`;
        
        let mealItemsHtml = '<div class="meal-items">';
        let calInfoStr = '';
        
        if (mealDict[dateKey] && mealDict[dateKey].length > 0) {
            mealDict[dateKey].forEach(mealData => {
                let rawMenu = mealData.DDISH_NM.replace(/<br\/>/g, '\n');
                let menuLines = rawMenu.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                calInfoStr = mealData.CAL_INFO;
                
                menuLines.forEach(menuLine => {
                    let allergies = [];
                    // 괄호 안에 들어가 있거나, 맨 끝에 점과 함께 붙어있는 숫자 패턴 추출 (예: 잡곡밥 (1.2.3.) 혹은 1.2.)
                    const matches = menuLine.match(/[\d\.\(\)]+$/);
                    if (matches) {
                        const numbers = matches[0].match(/\d+/g);
                        if (numbers) {
                            numbers.forEach(n => {
                                if (ALLERGY_MAP[n] && !allergies.includes(ALLERGY_MAP[n])) {
                                    allergies.push(ALLERGY_MAP[n]);
                                }
                            });
                        }
                    }
                    
                    // 알레르기 숫자 및 특수문자 제거 후 순수 메뉴 이름만 추출
                    const cleanName = menuLine.replace(/[0-9\.\(\)]+/g, '').trim();
                    const emoji = getEmojiForFood(cleanName);
                    
                    let badgesHtml = '';
                    if (allergies.length > 0) {
                        badgesHtml = `<div class="allergy-badges">` + 
                            allergies.map(a => `<span class="allergy-badge">${a}</span>`).join('') +
                        `</div>`;
                    }
                    
                    mealItemsHtml += `
                        <div class="meal-item">
                            <div class="menu-name"><span>${emoji}</span> <span>${cleanName}</span></div>
                            ${badgesHtml}
                        </div>
                    `;
                });
            });
            
            // 칼로리 추가
            if(calInfoStr) {
                mealItemsHtml += `<div class="calorie-info-cal">⚡ ${calInfoStr}</div>`;
            }
            
        } else if (isCurrentMonth && dayOfWeek !== 0 && dayOfWeek !== 6) {
           // 평일인데 급식이 없는 경우
           mealItemsHtml += `<div class="no-meal">급식 없음</div>`;
        }
        
        mealItemsHtml += '</div>';
        
        dayDiv.innerHTML = dayNumberHtml + mealItemsHtml;
        calendarGrid.appendChild(dayDiv);
        
        currentIterDate.setDate(currentIterDate.getDate() + 1);
    }
    
    loader.classList.add('hidden');
    calendarContainer.classList.remove('hidden');
}
