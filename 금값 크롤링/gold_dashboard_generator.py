import urllib.request
import json
import datetime
import csv
import webbrowser
import os

def fetch_gold_price_1year():
    url = "https://koreagoldx.co.kr/api/price/chart/list"
    
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=365)
    
    dataDateEnd = end_date.strftime("%Y.%m.%d")
    dataDateStart = start_date.strftime("%Y.%m.%d")
    
    payload = {
        "srchDt": "1Y",
        "type": "Au",
        "dataDateStart": dataDateStart,
        "dataDateEnd": dataDateEnd
    }
    
    req_body = json.dumps(payload).encode('utf-8')
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json"
    }
    
    req = urllib.request.Request(url, data=req_body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode('utf-8')
            json_data = json.loads(res_data)
            return json_data.get('list', [])
    except Exception as e:
        print(f"API 요청 에러: {e}")
        return []

def generate_dashboard(data):
    # Sort data by date ascending for charts
    try:
        data = sorted(data, key=lambda x: str(x.get('date', '')))
    except:
        pass
        
    dates = [x.get('date', '') for x in data]
    buy_prices = [x.get('s_pure', 0) for x in data]
    sell_prices = [x.get('p_pure', 0) for x in data]
    
    # Calculate some stats
    if buy_prices:
        current_buy = buy_prices[-1]
        max_buy = max(buy_prices)
        min_buy = min(buy_prices)
        
        # 30-day moving average roughly
        ma30_buy = []
        for i in range(len(buy_prices)):
            if i < 30:
                ma30_buy.append(None)
            else:
                ma30_buy.append(round(sum(buy_prices[i-30:i]) / 30))
    else:
        current_buy = max_buy = min_buy = 0
        ma30_buy = []

    # Prediction Algorithm: Next 30 Days (using 60-day Linear Regression)
    last_n_days = min(60, len(buy_prices))
    recent_prices = buy_prices[-last_n_days:] if buy_prices else []
    recent_dates = dates[-last_n_days:] if dates else []
    
    n = len(recent_prices)
    pred_dates = list(recent_dates)
    pred_history = list(recent_prices)
    pred_future = []
    
    if n > 1:
        pred_future = [None] * (n - 1) + [recent_prices[-1]]
        
        sum_x = sum(range(n))
        sum_y = sum(recent_prices)
        sum_xy = sum(i * recent_prices[i] for i in range(n))
        sum_xx = sum(i * i for i in range(n))
        
        slope_den = (n * sum_xx - sum_x * sum_x)
        m = (n * sum_xy - sum_x * sum_y) / slope_den if slope_den != 0 else 0
        b = (sum_y - m * sum_x) / n
        
        try:
            last_dt = datetime.datetime.strptime(recent_dates[-1], "%Y.%m.%d")
        except:
            last_dt = datetime.datetime.now()
        
        for i in range(30):
            future_x = n + i
            pred_y = round(m * future_x + b)
            
            # append to structures
            next_dt = last_dt + datetime.timedelta(days=i+1)
            pred_dates.append(next_dt.strftime("%Y.%m.%d"))
            pred_history.append(None)
            pred_future.append(pred_y)

    html_content = f"""
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>금 시세 대시보드 (1년)</title>
        <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;600;700&display=swap');
            body {{
                font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f7fa;
                color: #333;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .header h1 {{
                margin: 0;
                color: #2c3e50;
                font-size: 28px;
            }}
            .header p {{
                color: #7f8c8d;
                margin-top: 5px;
            }}
            .kpi-container {{
                display: flex;
                gap: 20px;
                margin-bottom: 30px;
            }}
            .kpi-card {{
                flex: 1;
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                text-align: center;
            }}
            .kpi-title {{
                font-size: 14px;
                color: #95a5a6;
                margin-bottom: 10px;
            }}
            .kpi-value {{
                font-size: 24px;
                font-weight: 700;
                color: #2c3e50;
            }}
            .chart-card {{
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                margin-bottom: 30px;
            }}
            .chart-view {{
                width: 100%;
                height: 400px;
            }}
            #mainChart {{ height: 500px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏆 금 시세 분석 대시보드</h1>
                <p>한국금거래소 1년 치 순금(3.75g) 시세 추이 & 향후 예측</p>
            </div>
            
            <div class="kpi-container">
                <div class="kpi-card">
                    <div class="kpi-title">현재가 (살 때)</div>
                    <div class="kpi-value">{current_buy:,} 원</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">최고가 (살 때)</div>
                    <div class="kpi-value" style="color: #e74c3c">{max_buy:,} 원</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">최저가 (살 때)</div>
                    <div class="kpi-value" style="color: #3498db">{min_buy:,} 원</div>
                </div>
            </div>

            <div class="chart-card">
                <div id="mainChart" class="chart-view"></div>
            </div>
            
            <div class="chart-card">
                <div id="diffChart" class="chart-view" style="height: 300px;"></div>
            </div>
            
            <div class="chart-card">
                <div id="predictChart" class="chart-view"></div>
            </div>
        </div>

        <script>
            // Data injected from Python
            const dates = {json.dumps(dates)};
            const buyPrices = {json.dumps(buy_prices)};
            const sellPrices = {json.dumps(sell_prices)};
            const ma30Buy = {json.dumps(ma30_buy)};
            
            const predDates = {json.dumps(pred_dates)};
            const predHistory = {json.dumps(pred_history)};
            const predFuture = {json.dumps(pred_future)};
            
            // Calculate spread (살 때 - 팔 때)
            const spread = buyPrices.map((val, idx) => val - sellPrices[idx]);

            // Main Line Chart
            const mainChart = echarts.init(document.getElementById('mainChart'));
            mainChart.setOption({{
                title: {{ text: '금 시세 및 30일 이동평균선', left: 'center' }},
                tooltip: {{ trigger: 'axis' }},
                legend: {{ data: ['내가 살 때', '내가 팔 때', '30일 이평선(살 때)'], bottom: 0 }},
                grid: {{ left: '3%', right: '4%', bottom: '10%', containLabel: true }},
                xAxis: {{ type: 'category', boundaryGap: false, data: dates }},
                yAxis: {{ type: 'value', scale: true, axisLabel: {{ formatter: '{{value}} 원' }} }},
                dataZoom: [{{ type: 'inside', start: 0, end: 100 }}, {{ start: 0, end: 100 }}],
                series: [
                    {{ name: '내가 살 때', type: 'line', data: buyPrices, itemStyle: {{ color: '#e74c3c' }}, showSymbol: false, lineStyle: {{ width: 2 }} }},
                    {{ name: '내가 팔 때', type: 'line', data: sellPrices, itemStyle: {{ color: '#3498db' }}, showSymbol: false, lineStyle: {{ width: 2 }} }},
                    {{ name: '30일 이평선(살 때)', type: 'line', data: ma30Buy, itemStyle: {{ color: '#f39c12' }}, showSymbol: false, lineStyle: {{ type: 'dashed', width: 2 }} }}
                ]
            }});

            // Spread Chart
            const diffChart = echarts.init(document.getElementById('diffChart'));
            diffChart.setOption({{
                title: {{ text: '금매수 - 금매도 차액 (스프레드)', left: 'center', textStyle: {{ fontSize: 14 }} }},
                tooltip: {{ trigger: 'axis' }},
                grid: {{ left: '3%', right: '4%', bottom: '8%', containLabel: true }},
                xAxis: {{ type: 'category', data: dates }},
                yAxis: {{ type: 'value', axisLabel: {{ formatter: '{{value}} 원' }}, scale: true }},
                series: [
                    {{
                        name: '차액',
                        type: 'bar',
                        data: spread,
                        itemStyle: {{ color: '#188df0' }}
                    }}
                ]
            }});
            
            // Prediction Chart
            const predictChart = echarts.init(document.getElementById('predictChart'));
            predictChart.setOption({{
                title: {{ text: '다음 달 금 시세 단기 예측 (최근 60일 데이터 기반 선형회귀)', left: 'center' }},
                tooltip: {{ trigger: 'axis' }},
                legend: {{ data: ['최근 시세', '향후 30일 예측'], bottom: 0 }},
                grid: {{ left: '3%', right: '4%', bottom: '10%', containLabel: true }},
                xAxis: {{ type: 'category', boundaryGap: false, data: predDates }},
                yAxis: {{ type: 'value', scale: true, axisLabel: {{ formatter: '{{value}} 원' }} }},
                series: [
                    {{
                        name: '최근 시세',
                        type: 'line',
                        data: predHistory,
                        itemStyle: {{ color: '#e74c3c' }},
                        showSymbol: true,
                        symbolSize: 4,
                        lineStyle: {{ width: 2 }}
                    }},
                    {{
                        name: '향후 30일 예측',
                        type: 'line',
                        data: predFuture,
                        itemStyle: {{ color: '#9b59b6' }},
                        showSymbol: true,
                        symbolSize: 4,
                        lineStyle: {{ width: 2, type: 'dashed' }}
                    }}
                ]
            }});

            window.addEventListener('resize', () => {{
                mainChart.resize();
                diffChart.resize();
                predictChart.resize();
            }});
        </script>
    </body>
    </html>
    """
    
    filepath = os.path.join(os.getcwd(), 'gold_dashboard.html')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"대시보드가 성공적으로 생성되었습니다: {filepath}")
    
    # Open in browser natively
    try:
        webbrowser.open('file://' + filepath)
    except:
        pass

if __name__ == "__main__":
    print("금시세 데이터를 수집합니다...")
    data = fetch_gold_price_1year()
    if data:
        print("대시보드를 생성합니다...")
        generate_dashboard(data)
    else:
        print("데이터 수집 실패로 대시보드를 생성할 수 없습니다.")
