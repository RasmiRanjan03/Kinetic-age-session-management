import api from './api';

export const getPayments = async (params = {}) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

export const getPaymentById = async (id) => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

export const recordPayment = async (paymentData) => {
  const response = await api.post('/payments', paymentData);
  return response.data;
};

export const updatePayment = async (id, paymentData) => {
  const response = await api.put(`/payments/${id}`, paymentData);
  return response.data;
};

export const deletePayment = async (id) => {
  const response = await api.delete(`/payments/${id}`);
  return response.data;
};
