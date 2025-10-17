# Weather Module

Module quản lý dữ liệu thời tiết và cảnh báo nông nghiệp.

## Features

- Lấy dữ liệu thời tiết hiện tại và dự báo
- Cảnh báo thời tiết cho nông nghiệp
- Cache dữ liệu để tối ưu performance
- Tích hợp OpenWeather API

## Endpoints

### GET /api/v1/weather
Lấy dữ liệu thời tiết hiện tại và dự báo 5 ngày.

**Query Parameters:**
- `cityName` (string, optional): Tên thành phố
- `lat` (number, optional): Vĩ độ
- `lon` (number, optional): Kinh độ

**Example:**
```bash
GET /api/v1/weather?cityName=Hanoi
GET /api/v1/weather?lat=21.0285&lon=105.8542
```

### GET /api/v1/weather/alerts
Lấy cảnh báo thời tiết cho nông nghiệp.

**Query Parameters:**
- `lat` (number, required): Vĩ độ
- `lon` (number, required): Kinh độ

**Example:**
```bash
GET /api/v1/weather/alerts?lat=21.0285&lon=105.8542
```

## Environment Variables

```env
OPENWEATHER_API_KEY=your_openweather_api_key
```

## Response Format

```json
{
  "success": true,
  "data": {
    "location": {
      "name": "Hanoi",
      "country": "VN",
      "coordinates": {
        "lat": 21.0285,
        "lon": 105.8542
      }
    },
    "current": {
      "temperature": 25,
      "humidity": 70,
      "pressure": 1013,
      "description": "mây rải rác",
      "icon": "03d",
      "windSpeed": 3.5,
      "windDirection": 180
    },
    "forecast": [
      {
        "date": "2024-01-15T00:00:00.000Z",
        "temperature": {
          "min": 20,
          "max": 28
        },
        "humidity": 65,
        "description": "nắng",
        "icon": "01d",
        "rain": 0
      }
    ]
  }
}
```
