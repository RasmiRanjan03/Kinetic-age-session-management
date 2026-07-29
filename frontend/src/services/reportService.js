import api from './api';

export const getMonthlyReport = async (clientId, year, month) => {
  const response = await api.get('/reports/monthly', {
    params: { clientId, year, month },
  });
  return response.data;
};

export const getBusinessReport = async (filter) => {
  const response = await api.get('/reports/business', {
    params: { filter },
  });
  return response.data;
};
