import urllib.request
import json
import datetime
import csv

def fetch_gold_price_1year():
    """
    한국금거래소(koreagoldx.co.kr)에서 1년치 금시세(내가 살 때, 내가 팔 때)를 
    API를 통해 크롤링하는 함수입니다.
    """
    url = "https://koreagoldx.co.kr/api/price/chart/list"
    
    # 오늘 날짜와 1년 전 날짜 계산
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=365)
    
    dataDateEnd = end_date.strftime("%Y.%m.%d")
    dataDateStart = start_date.strftime("%Y.%m.%d")
    
    # API 요청 페이로드 설정
    payload = {
        "srchDt": "1Y",  # 1년
        "type": "Au",    # 금
        "dataDateStart": dataDateStart,
        "dataDateEnd": dataDateEnd
    }
    
    req_body = json.dumps(payload).encode('utf-8')
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json"
    }
    
    req = urllib.request.Request(url, data=req_body, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode('utf-8')
            json_data = json.loads(res_data)
            
            # 응답 데이터에서 'list' 추출
            price_list = json_data.get('list', [])
            print(f"총 {len(price_list)}건의 데이터를 성공적으로 가져왔습니다.")
            
            return price_list
    except Exception as e:
        print(f"API 요청 중 에러 발생: {e}")
        return []

def save_to_csv(data, filename="gold_price_1year.csv"):
    """
    크롤링한 데이터를 CSV 파일로 저장하는 함수입니다.
    """
    if not data:
        print("저장할 데이터가 없습니다.")
        return
        
    # 저장할 헤더(컬럼명) 지정
    headers = ['고시시각', '내가 살 때(3.75g, 순금)', '내가 팔 때(3.75g, 순금)']
    
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for item in data:
            date = item.get('date', '')
            buy_price = item.get('s_pure', 0)
            sell_price = item.get('p_pure', 0)
            
            writer.writerow([date, buy_price, sell_price])
            
    print(f"데이터가 {filename}에 저장되었습니다.")

if __name__ == "__main__":
    print("1년치 금시세 크롤링을 시작합니다...")
    gold_data = fetch_gold_price_1year()
    
    if gold_data:
        # 상위 5개 데이터 출력 테스트
        print("\n[최근 5건 데이터 미리보기]")
        for row in gold_data[:5]:
            print(f"시간: {row['date']} | 내가 살 때: {row['s_pure']:,}원 | 내가 팔 때: {row['p_pure']:,}원")
            
        # CSV로 저장
        save_to_csv(gold_data)
