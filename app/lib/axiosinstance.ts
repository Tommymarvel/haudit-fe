import axios, { AxiosInstance } from 'axios';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g. https://api.yoursite.com
  withCredentials: true, // send & receive cookies
});


export default axiosInstance;
