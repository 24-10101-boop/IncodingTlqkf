import urllib.request
import json
import datetime
import re

def get_meal(date_dt):
    # API 요청을 위한 날짜 포맷 (YYYYMMDD)
    date_str = date_dt.strftime("%Y%m%d")
    
    # 나이스 교육정보 개방 포털 API (자운고등학교 - 시도교육청코드 B10, 행정표준코드 7010703)
    url = f"https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=7010703&MLSV_YMD={date_str}"
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            # 응답 데이터 파싱
            if "mealServiceDietInfo" in data:
                meal_data = data["mealServiceDietInfo"][1]["row"][0]
                diet = meal_data["DDISH_NM"]
                
                # <br/> 태그를 줄바꿈으로 변환
                diet = diet.replace("<br/>", "\n")
                
                # 불필요한 알레르기 정보 숫자 및 괄호 제거 (예: (1.2.3.) 등)
                diet = re.sub(r'[0-9\.\(\)]+', '', diet)
                
                print(f"🍽️ === {date_dt.year}년 {date_dt.month}월 {date_dt.day}일 자운고등학교 급식 === 🍽️")
                
                # 빈 줄 제거 후 보기 좋게 출력
                clean_lines = [line.strip() for line in diet.split("\n") if line.strip()]
                for line in clean_lines:
                    print(line)
                    
                print("-" * 35)
                print(f"[칼로리] {meal_data.get('CAL_INFO', '알 수 없음')}")
                print("=========================================\n")
            else:
                print(f"🍽️ === {date_dt.year}년 {date_dt.month}월 {date_dt.day}일 자운고등학교 급식 === 🍽️")
                print("쉬는 날이거나 급식 정보가 등록되지 않았습니다.")
                print("=========================================\n")
    except Exception as e:
        print(f"데이터를 가져오는 중 오류가 발생했습니다: {e}")

if __name__ == "__main__":
    today = datetime.datetime.now()
    
    # 오늘 포함 앞으로 3일간의 급식 정보 확인
    dates_to_check = [
        today,
        today + datetime.timedelta(days=1),
        today + datetime.timedelta(days=2)
    ]
    
    print("학교 종이 땡땡땡! 자운고등학교 급식 정보 알리미입니다.\n")
    for d in dates_to_check:
        get_meal(d)
        
    # 콘솔 창에서 바로 닫히지 않게 대기
    input("프로그램을 종료하려면 엔터(Enter) 키를 누르세요...")
