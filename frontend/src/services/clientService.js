import api from './api';

/**
 * Fetch all client profiles
 */
export const getClients = async () => {
  const response = await api.get('/clients');
  return response.data;
};

/**
 * Fetch specific client by MongoDB ID
 */
export const getClientById = async (id) => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

/**
 * Add a new client
 */
export const createClient = async (clientData) => {
  const response = await api.post('/clients', clientData);
  return response.data;
};

/**
 * Update client details
 */
export const updateClient = async (id, clientData) => {
  const response = await api.put(`/clients/${id}`, clientData);
  return response.data;
};

/**
 * Delete a client record
 */
export const deleteClient = async (id) => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};

/**
 * Fetch client database aggregates for dashboard statistics
 */
export const getClientStats = async () => {
  const response = await api.get('/clients/stats');
  return response.data;
};
