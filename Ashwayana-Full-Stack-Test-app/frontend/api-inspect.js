const axios = require('axios');

async function inspectEndpoints() {
  const baseURL = 'http://192.168.68.116:8081/api';
  console.log('Inspecting backend at:', baseURL);

  try {
    const authRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@ashvayana.com',
      password: 'admin123'
    });
    const token = authRes.data?.data?.token;
    console.log('Login Success. Token acquired.');

    const client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const getAndInspect = async (path) => {
      console.log(`\n=== GET ${path} ===`);
      try {
        const res = await client.get(path);
        console.log('Status:', res.status);
        console.log('Data sample:', JSON.stringify(res.data, null, 2));
      } catch (err) {
        console.error(`Error GET ${path}:`, err.response ? err.response.data : err.message);
      }
    };

    await getAndInspect('/properties?page=0&size=1');
    await getAndInspect('/projects?page=0&size=1');
    await getAndInspect('/materials?page=0&size=1');
    await getAndInspect('/testimonials?page=0&size=1');
    await getAndInspect('/settings');
    await getAndInspect('/users?page=0&size=1');
    await getAndInspect('/enquiries?page=0&size=1');

  } catch (error) {
    console.error('Inspection failed:', error.response ? error.response.data : error.message);
  }
}

inspectEndpoints();
