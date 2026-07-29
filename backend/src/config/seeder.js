import Client from '../models/Client.js';
import Subscription from '../models/Subscription.js';
import Session from '../models/Session.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

export const seedDatabase = async () => {
  try {
    // Clear everything first to ensure clean state with correct models
    await Client.deleteMany({});
    await Subscription.deleteMany({});
    await Session.deleteMany({});
    await Payment.deleteMany({});
    await User.deleteMany({});

    console.log('Seeding database with realistic senior wellness records...');

    // 1. Create Client Profiles first
    const clientsData = [
      {
        fullName: 'Sarah Jenkins',
        age: 68,
        gender: 'Female',
        email: 'sarah.jenkins@gmail.com',
        phone: '9876543210',
        address: '102 Oakridge Lane, Apt 4B',
        status: 'Active',
        subscriptionStatus: 'Active',
      },
      {
        fullName: 'Robert Chen',
        age: 72,
        gender: 'Male',
        email: 'robert.chen@yahoo.com',
        phone: '8765432109',
        address: '45 Pine Valley Blvd',
        status: 'Active',
        subscriptionStatus: 'Active',
      },
      {
        fullName: 'Margaret Albright',
        age: 81,
        gender: 'Female',
        email: 'margaret.albright@outlook.com',
        phone: '7654321098',
        address: '12 Maplewood Circle',
        status: 'Active',
        subscriptionStatus: 'Expired',
      },
      {
        fullName: 'Thomas Miller',
        age: 64,
        gender: 'Male',
        email: 'thomas.miller@gmail.com',
        phone: '6543210987',
        address: '89 Hillside Drive',
        status: 'Active',
        subscriptionStatus: 'Active',
      },
      {
        fullName: 'Dorothy Watson',
        age: 77,
        gender: 'Female',
        email: 'dorothy.watson@comcast.net',
        phone: '5432109876',
        address: '304 Silver Springs Court',
        status: 'Active',
        subscriptionStatus: 'None',
      },
      {
        fullName: 'James Cooper',
        age: 85,
        gender: 'Male',
        email: 'james.cooper@gmail.com',
        phone: '4321098765',
        address: '56 Heritage Way',
        status: 'Inactive',
        subscriptionStatus: 'None',
      },
      {
        fullName: 'Patricia Gallagher',
        age: 70,
        gender: 'Female',
        email: 'patricia.g@verizon.net',
        phone: '3210987654',
        address: '719 Whispering Pines Rd',
        status: 'Active',
        subscriptionStatus: 'Active',
      },
      {
        fullName: 'Arthur Pendelton',
        age: 79,
        gender: 'Male',
        email: 'arthur.p@outlook.com',
        phone: '2109876543',
        address: '12 Valley Vista Dr',
        status: 'Inactive',
        subscriptionStatus: 'Expired',
      },
    ];

    const createdClients = await Client.create(clientsData);
    console.log(`Seeded ${createdClients.length} clients.`);

    // 2. Create Client profile for the Admin user
    const adminClient = await Client.create({
      fullName: 'KineticAge Admin',
      email: 'admin@kineticage.com',
      phone: '9999999999',
      age: 65,
      gender: 'Other',
      address: '123 Wellness Center Drive',
      emergencyContact: 'N/A',
      status: 'Active',
      subscriptionStatus: 'None',
    });

    // 3. Create User credentials linked to their client profiles
    await User.create({
      name: 'KineticAge Admin',
      email: 'admin@kineticage.com',
      password: 'Password123!',
      role: 'admin',
      clientId: adminClient._id,
    });

    await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@gmail.com',
      password: 'Password123!',
      role: 'user',
      clientId: createdClients[0]._id,
    });

    console.log('Seeded default admin and user credentials.');

    // Dates calculations
    const today = new Date();
    const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const futureThirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const futureSixtyDays = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    // 4. Create Subscriptions
    const sub1 = await Subscription.create({
      clientId: createdClients[0]._id,
      planName: '3 Month Wellness',
      planDescription: 'Cardio mobility and core strength program',
      price: 220,
      durationMonths: 3,
      totalSessions: 24,
      completedSessions: 12,
      remainingSessions: 12,
      startDate: thirtyDaysAgo,
      endDate: futureSixtyDays,
      status: 'Active',
      paymentStatus: 'Paid',
      paymentMethod: 'Card',
      amountPaid: 220,
      remainingBalance: 0,
      renewalHistory: [],
    });

    const sub2 = await Subscription.create({
      clientId: createdClients[1]._id,
      planName: '1 Month Wellness',
      planDescription: 'Balance and knee stabilization rehab',
      price: 80,
      durationMonths: 1,
      totalSessions: 8,
      completedSessions: 4,
      remainingSessions: 4,
      startDate: tenDaysAgo,
      endDate: futureThirtyDays,
      status: 'Active',
      paymentStatus: 'Partially Paid',
      paymentMethod: 'Card',
      amountPaid: 40,
      remainingBalance: 40,
      renewalHistory: [],
    });

    const sub3 = await Subscription.create({
      clientId: createdClients[2]._id,
      planName: '1 Month Wellness',
      planDescription: 'Strength and mobility improvement',
      price: 80,
      durationMonths: 1,
      totalSessions: 8,
      completedSessions: 8,
      remainingSessions: 0,
      startDate: sixtyDaysAgo,
      endDate: thirtyDaysAgo,
      status: 'Expired',
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      amountPaid: 80,
      remainingBalance: 0,
      renewalHistory: [],
    });

    const sub4 = await Subscription.create({
      clientId: createdClients[3]._id,
      planName: '3 Month Wellness',
      planDescription: 'Standard strength maintenance',
      price: 220,
      durationMonths: 3,
      totalSessions: 24,
      completedSessions: 2,
      remainingSessions: 22,
      startDate: tenDaysAgo,
      endDate: futureSixtyDays,
      status: 'Active',
      paymentStatus: 'Paid',
      paymentMethod: 'Net Banking',
      amountPaid: 220,
      remainingBalance: 0,
      renewalHistory: [],
    });

    const expiringSoonDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
    const sub5 = await Subscription.create({
      clientId: createdClients[6]._id,
      planName: 'Custom Plan',
      planDescription: 'Specialized physical training core program',
      price: 150,
      durationMonths: 2,
      totalSessions: 16,
      completedSessions: 14,
      remainingSessions: 2,
      startDate: thirtyDaysAgo,
      endDate: expiringSoonDate,
      status: 'Expiring Soon',
      paymentStatus: 'Partially Paid',
      paymentMethod: 'Card',
      amountPaid: 100,
      remainingBalance: 50,
      renewalHistory: [],
    });

    const sub6 = await Subscription.create({
      clientId: createdClients[7]._id,
      planName: 'Custom Plan',
      planDescription: 'Rehabilitation training exercises',
      price: 100,
      durationMonths: 1,
      totalSessions: 10,
      completedSessions: 10,
      remainingSessions: 0,
      startDate: ninetyDaysAgo,
      endDate: sixtyDaysAgo,
      status: 'Expired',
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      amountPaid: 100,
      remainingBalance: 0,
      renewalHistory: [],
    });

    console.log('Seeded subscriptions.');

    // 5. Create Payments
    await Payment.create([
      {
        clientId: createdClients[0]._id,
        subscriptionId: sub1._id,
        invoiceNumber: 'INV-2026-0001',
        totalAmount: 220,
        amountPaid: 220,
        remainingBalance: 0,
        paymentMethod: 'Card',
        paymentStatus: 'Paid',
        paymentDate: thirtyDaysAgo,
        transactionReference: 'TXN-98239842',
        collectedBy: 'Admin',
        notes: 'Paid in full for 3-Month package.',
      },
      {
        clientId: createdClients[1]._id,
        subscriptionId: sub2._id,
        invoiceNumber: 'INV-2026-0002',
        totalAmount: 80,
        amountPaid: 40,
        remainingBalance: 40,
        paymentMethod: 'Card',
        paymentStatus: 'Partially Paid',
        paymentDate: tenDaysAgo,
        transactionReference: 'TXN-4832048',
        collectedBy: 'Admin',
        notes: 'First installment. Next payment due in 15 days.',
      },
      {
        clientId: createdClients[2]._id,
        subscriptionId: sub3._id,
        invoiceNumber: 'INV-2026-0003',
        totalAmount: 80,
        amountPaid: 80,
        remainingBalance: 0,
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        paymentDate: sixtyDaysAgo,
        collectedBy: 'Admin',
        notes: 'Cash payment processed at counter.',
      },
      {
        clientId: createdClients[3]._id,
        subscriptionId: sub4._id,
        invoiceNumber: 'INV-2026-0004',
        totalAmount: 220,
        amountPaid: 220,
        remainingBalance: 0,
        paymentMethod: 'Net Banking',
        paymentStatus: 'Paid',
        paymentDate: tenDaysAgo,
        transactionReference: 'BANK-948302',
        collectedBy: 'Admin',
        notes: 'Direct deposit confirmed.',
      },
      {
        clientId: createdClients[6]._id,
        subscriptionId: sub5._id,
        invoiceNumber: 'INV-2026-0005',
        totalAmount: 150,
        amountPaid: 100,
        remainingBalance: 50,
        paymentMethod: 'Card',
        paymentStatus: 'Partially Paid',
        paymentDate: tenDaysAgo,
        transactionReference: 'TXN-382948',
        collectedBy: 'Admin',
        notes: 'Partial charge on debit card.',
      },
      {
        clientId: createdClients[7]._id,
        subscriptionId: sub6._id,
        invoiceNumber: 'INV-2026-0006',
        totalAmount: 100,
        amountPaid: 100,
        remainingBalance: 0,
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        paymentDate: ninetyDaysAgo,
        collectedBy: 'Admin',
        notes: 'Paid fully in cash.',
      },
    ]);
    console.log('Seeded payments.');

    // 6. Create Sessions
    await Session.create([
      {
        clientId: createdClients[0]._id,
        therapistName: 'Dr. Emily Watson',
        programType: 'Balance Training',
        sessionDate: thirtyDaysAgo,
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        attendance: 'Present',
        status: 'Completed',
        notes: 'Completed all exercises successfully. Solid mobility drills execution.',
      },
      {
        clientId: createdClients[0]._id,
        therapistName: 'Dr. Emily Watson',
        programType: 'Mobility Training',
        sessionDate: tenDaysAgo,
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        attendance: 'Present',
        status: 'Completed',
        notes: 'Needs additional balance training. Reported mild knee discomfort.',
      },
      {
        clientId: createdClients[0]._id,
        therapistName: 'Dr. Emily Watson',
        programType: 'Yoga',
        sessionDate: futureThirtyDays,
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
        attendance: 'Absent',
        status: 'Scheduled',
        notes: 'Yoga flexibility and mental focus posture sessions.',
      },
      {
        clientId: createdClients[1]._id,
        therapistName: 'Dr. Marcus Vance',
        programType: 'Rehabilitation Exercise',
        sessionDate: tenDaysAgo,
        startTime: '14:00',
        endTime: '15:00',
        duration: 60,
        attendance: 'Present',
        status: 'Completed',
        notes: 'Excellent improvement compared to previous session. Quad strength increasing.',
      },
      {
        clientId: createdClients[1]._id,
        therapistName: 'Dr. Marcus Vance',
        programType: 'Balance Training',
        sessionDate: futureThirtyDays,
        startTime: '13:30',
        endTime: '14:30',
        duration: 60,
        attendance: 'Absent',
        status: 'Scheduled',
        notes: 'Balance boards check and ankle support stabilization exercises.',
      },
    ]);
    console.log('Seeded session log history.');
    console.log('Database seeding successfully finished.');
  } catch (error) {
    console.error('Error during database seed generation:', error.message);
  }
};
