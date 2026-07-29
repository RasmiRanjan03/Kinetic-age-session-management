import api from './api';

export const getSubscriptions = async (params = {}) => {
  const response = await api.get('/subscriptions', { params });
  return response.data;
};

export const getSubscriptionById = async (id) => {
  const response = await api.get(`/subscriptions/${id}`);
  return response.data;
};

export const createSubscription = async (subscriptionData) => {
  const response = await api.post('/subscriptions', subscriptionData);
  return response.data;
};

export const updateSubscription = async (id, subscriptionData) => {
  const response = await api.put(`/subscriptions/${id}`, subscriptionData);
  return response.data;
};

export const renewSubscription = async (id, renewalData) => {
  const response = await api.post(`/subscriptions/${id}/renew`, renewalData);
  return response.data;
};

export const cancelSubscription = async (id) => {
  const response = await api.post(`/subscriptions/${id}/cancel`);
  return response.data;
};

export const deleteSubscription = async (id) => {
  const response = await api.delete(`/subscriptions/${id}`);
  return response.data;
};
