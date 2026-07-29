// Report generation helper service functions

export const buildReportData = async (clientId, startDate, endDate) => {
  // In the future, this will run aggregations on the Session model
  return {
    sessionsLogged: 0,
    activeMinutes: 0,
    exercisesCompleted: [],
  };
};
