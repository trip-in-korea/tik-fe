const axios = require('axios');
const fs = require('fs');
const path = require('path');

// .env.local 파일 파싱
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

console.log('Testing with baseURL:', baseURL);
console.log('Testing with serviceKey:', serviceKey.substring(0, 10) + '...');

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

async function runTests() {
  const contentId = '1001011'; // 윤이상 기념공원
  const contentTypeId = '12';

  try {
    console.log('\n--- Testing /detailCommon2 ---');
    const commonRes = await instance.get('/detailCommon2', {
      params: {
        serviceKey,
        contentId,
        contentTypeId,
        defaultYN: 'Y',
        firstImageYN: 'Y',
        areaYN: 'Y',
        addrYN: 'Y',
        mapYN: 'Y',
        overviewYN: 'Y'
      }
    });
    console.log('Status:', commonRes.status);
    console.log('Response Header:', JSON.stringify(commonRes.data?.response?.header, null, 2));
    console.log('Item count:', commonRes.data?.response?.body?.items?.item ? 1 : 0);
    if (commonRes.data?.response?.body?.items?.item) {
      console.log('Item keys:', Object.keys(commonRes.data.response.body.items.item));
    }
  } catch (err) {
    console.error('Error on /detailCommon2:', err.message);
    if (err.response) {
      console.error('Error body:', err.response.data);
    }
  }

  try {
    console.log('\n--- Testing /detailIntro2 ---');
    const introRes = await instance.get('/detailIntro2', {
      params: {
        serviceKey,
        contentId,
        contentTypeId
      }
    });
    console.log('Status:', introRes.status);
    console.log('Response Header:', JSON.stringify(introRes.data?.response?.header, null, 2));
    console.log('Item count:', introRes.data?.response?.body?.items?.item ? 1 : 0);
  } catch (err) {
    console.error('Error on /detailIntro2:', err.message);
  }
}

runTests();
