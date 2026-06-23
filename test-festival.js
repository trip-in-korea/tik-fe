const axios = require('axios');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const serviceKey = env.NEXT_PUBLIC_TOUR_API_KEY;
const baseURL = env.NEXT_PUBLIC_TOUR_API_BASE_URL || 'https://apis.data.go.kr/B551011/KorService2';

const instance = axios.create({
  baseURL,
  params: {
    MobileOS: 'ETC',
    MobileApp: 'DadaTrip',
    _type: 'json',
  },
  paramsSerializer: {
    serialize: (params) => {
      return Object.entries(params)
        .map(([key, value]) => {
          if (key === 'serviceKey') {
            return `${key}=${value}`;
          }
          return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        })
        .join('&');
    }
  }
});

async function run() {
  try {
    const res = await instance.get('/searchFestival2', {
      params: {
        serviceKey,
        eventStartDate: '20260601',
        numOfRows: 10,
        pageNo: 1
      }
    });
    console.log('Status:', res.status);
    console.log('Header:', JSON.stringify(res.data?.response?.header, null, 2));
    console.log('Body items count:', res.data?.response?.body?.items?.item?.length || 0);
    if (res.data?.response?.body?.items?.item) {
      console.log('First item:', JSON.stringify(res.data?.response?.body?.items?.item[0], null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
