import { PrismaClient, Role, ProposalStatus, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const demoUsers = [
  {
    email: 'instructor@kmutt.ac.th',
    fullName: 'Dr. Piyanit Ua-areemitr',
    role: Role.INSTRUCTOR,
  },
  {
    email: 'pawarit@mail.kmutt.ac.th',
    fullName: 'Pawarit Wongdaeng',
    studentCode: '67070503466',
    role: Role.STUDENT,
  },
  {
    email: 'tatchakorn@mail.kmutt.ac.th',
    fullName: 'Tatchakorn Thamnimitr',
    studentCode: '67070503415',
    role: Role.STUDENT,
  },
  {
    email: 'somchai@mail.kmutt.ac.th',
    fullName: 'Somchai Rakdee',
    studentCode: '67070503499',
    role: Role.STUDENT,
  },
  {
    email: 'suda@mail.kmutt.ac.th',
    fullName: 'Suda Jaidee',
    studentCode: '67070503488',
    role: Role.STUDENT,
  },
  {
    email: 'niran@mail.kmutt.ac.th',
    fullName: 'Niran Sukjai',
    studentCode: '67070503477',
    role: Role.STUDENT,
  },
  // Lab 6 accounts are deliberately separate from the historical demo data.
  // In production, seedProductionDatabase creates only missing users, so these
  // entries do not reset data, change existing passwords, or alter memberships.
  {
    email: 'uat.s3@mail.kmutt.ac.th',
    fullName: 'Lab 6 UAT Student 3',
    studentCode: 'L6UAT2026S3',
    role: Role.STUDENT,
  },
  {
    email: 'uat.s4@mail.kmutt.ac.th',
    fullName: 'Lab 6 UAT Student 4',
    studentCode: 'L6UAT2026S4',
    role: Role.STUDENT,
  },
  {
    email: 'uat.r1@mail.kmutt.ac.th',
    fullName: 'Lab 6 UAT Retest 1',
    studentCode: 'L6UAT2026R1',
    role: Role.STUDENT,
  },
  {
    email: 'uat.r2@mail.kmutt.ac.th',
    fullName: 'Lab 6 UAT Retest 2',
    studentCode: 'L6UAT2026R2',
    role: Role.STUDENT,
  },
  {
    email: 'uat.r3@mail.kmutt.ac.th',
    fullName: 'Lab 6 UAT Retest 3',
    studentCode: 'L6UAT2026R3',
    role: Role.STUDENT,
  },
  {
    email: 'uat.r4@mail.kmutt.ac.th',
    fullName: 'Lab 6 UAT Retest 4',
    studentCode: 'L6UAT2026R4',
    role: Role.STUDENT,
  },
] as const;

async function seedProductionDatabase(
  customPrisma: PrismaClient,
  passwordHash: string
) {
  const users: User[] = [];
  for (const userData of demoUsers) {
    const user = await customPrisma.user.findUnique({
      where: { email: userData.email },
    });
    users.push(
      user ??
        (await customPrisma.user.create({
          data: { ...userData, passwordHash },
        }))
    );
  }

  const course =
    (await customPrisma.course.findUnique({ where: { code: 'CPE334' } })) ??
    (await customPrisma.course.create({
      data: {
        code: 'CPE334',
        name: 'Software Engineering in the Age of AI Agents',
        term: '1/2026',
        maxTeamSize: 3,
      },
    }));

  async function ensureDemoTeam(
    name: string,
    leaderEmail: string,
    proposal: {
      title: string;
      problemStatement: string;
      techStack: string;
      repoUrl: string;
      status: ProposalStatus;
      revisionCount: number;
      submittedAt?: Date;
    }
  ) {
    const leader = users.find((user) => user.email === leaderEmail);
    if (!leader) {
      throw new Error(`Seed user not found for demo team "${name}".`);
    }

    const team =
      (await customPrisma.projectTeam.findFirst({
        where: { courseId: course.id, name },
      })) ??
      (await customPrisma.projectTeam.create({
        data: { name, courseId: course.id, createdById: leader.id },
      }));

    const membership = await customPrisma.teamMember.findFirst({
      where: { courseId: course.id, userId: leader.id },
    });
    if (!membership) {
      await customPrisma.teamMember.create({
        data: {
          teamId: team.id,
          courseId: course.id,
          userId: leader.id,
          memberRole: 'LEADER',
        },
      });
    }

    const existingProposal = await customPrisma.projectProposal.findUnique({
      where: { teamId: team.id },
    });
    if (!existingProposal) {
      await customPrisma.projectProposal.create({
        data: { teamId: team.id, ...proposal },
      });
    }

    return team;
  }

  const teamAlpha = await ensureDemoTeam(
    'Team Alpha',
    'pawarit@mail.kmutt.ac.th',
    {
      title: 'CoursePMS: University Course Project Management Platform',
      problemStatement:
        'University capstone and software engineering courses lack an integrated system to enforce team size limits, prevent duplicate memberships, and manage structured proposal approvals.',
      techStack: 'React 18, TypeScript, Express, Prisma, PostgreSQL',
      repoUrl: 'https://github.com/martinvadre/course-pms',
      status: ProposalStatus.DRAFT,
      revisionCount: 0,
    }
  );
  const teamBeta = await ensureDemoTeam(
    'Team Beta',
    'somchai@mail.kmutt.ac.th',
    {
      title: 'SmartLab Equipment Booking & Calibration Tracker',
      problemStatement:
        'Engineering laboratories need a reservation and calibration tracking platform to prevent overlapping bookings on specialized oscilloscopes and 3D printers.',
      techStack: 'React, Node.js, Express, PostgreSQL',
      repoUrl: 'https://github.com/example/smartlab-booking',
      status: ProposalStatus.SUBMITTED,
      revisionCount: 1,
      submittedAt: new Date(),
    }
  );

  return {
    course,
    instructor: users[0],
    pawarit: users[1],
    tatchakorn: users[2],
    somchai: users[3],
    suda: users[4],
    niran: users[5],
    teamAlpha,
    teamBeta,
  };
}

export async function seedDatabase(customPrisma: PrismaClient = prisma) {
  const isProduction = process.env.NODE_ENV === 'production';
  const demoPassword =
    process.env.DEMO_USER_PASSWORD || (isProduction ? undefined : 'Password123!');
  if (!demoPassword?.trim()) {
    throw new Error('DEMO_USER_PASSWORD must be configured before seeding production.');
  }
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  if (isProduction) {
    return seedProductionDatabase(customPrisma, passwordHash);
  }

  await customPrisma.milestoneSubmission.deleteMany();
  await customPrisma.milestone.deleteMany();
  await customPrisma.projectProposal.deleteMany();
  await customPrisma.teamMember.deleteMany();
  await customPrisma.projectTeam.deleteMany();
  await customPrisma.course.deleteMany();
  await customPrisma.user.deleteMany();

  const instructor = await customPrisma.user.create({
    data: {
      email: 'instructor@kmutt.ac.th',
      fullName: 'Dr. Piyanit Ua-areemitr',
      passwordHash,
      role: Role.INSTRUCTOR,
    },
  });

  const pawarit = await customPrisma.user.create({
    data: {
      email: 'pawarit@mail.kmutt.ac.th',
      fullName: 'Pawarit Wongdaeng',
      studentCode: '67070503466',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const tatchakorn = await customPrisma.user.create({
    data: {
      email: 'tatchakorn@mail.kmutt.ac.th',
      fullName: 'Tatchakorn Thamnimitr',
      studentCode: '67070503415',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const somchai = await customPrisma.user.create({
    data: {
      email: 'somchai@mail.kmutt.ac.th',
      fullName: 'Somchai Rakdee',
      studentCode: '67070503499',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const suda = await customPrisma.user.create({
    data: {
      email: 'suda@mail.kmutt.ac.th',
      fullName: 'Suda Jaidee',
      studentCode: '67070503488',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const niran = await customPrisma.user.create({
    data: {
      email: 'niran@mail.kmutt.ac.th',
      fullName: 'Niran Sukjai',
      studentCode: '67070503477',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const course = await customPrisma.course.create({
    data: {
      code: 'CPE334',
      name: 'Software Engineering in the Age of AI Agents',
      term: '1/2026',
      maxTeamSize: 3,
    },
  });

  // Team Alpha: Created by Pawarit (1 member initially; Tatchakorn can be added in workflow)
  const teamAlpha = await customPrisma.projectTeam.create({
    data: {
      name: 'Team Alpha',
      courseId: course.id,
      createdById: pawarit.id,
      members: {
        create: [
          {
            userId: pawarit.id,
            courseId: course.id,
            memberRole: 'LEADER',
          },
        ],
      },
      proposal: {
        create: {
          title: 'CoursePMS: University Course Project Management Platform',
          problemStatement:
            'University capstone and software engineering courses lack an integrated system to enforce team size limits, prevent duplicate memberships, and manage structured proposal approvals.',
          techStack: 'React 18, TypeScript, Express, Prisma, PostgreSQL',
          repoUrl: 'https://github.com/martinvadre/course-pms',
          status: ProposalStatus.DRAFT,
          revisionCount: 0,
        },
      },
    },
  });

  // Team Beta: Created by Somchai with a private SUBMITTED proposal (used to verify BR-06 cross-team isolation)
  const teamBeta = await customPrisma.projectTeam.create({
    data: {
      name: 'Team Beta',
      courseId: course.id,
      createdById: somchai.id,
      members: {
        create: [
          {
            userId: somchai.id,
            courseId: course.id,
            memberRole: 'LEADER',
          },
        ],
      },
      proposal: {
        create: {
          title: 'SmartLab Equipment Booking & Calibration Tracker',
          problemStatement:
            'Engineering laboratories need a reservation and calibration tracking platform to prevent overlapping bookings on specialized oscilloscopes and 3D printers.',
          techStack: 'React, Node.js, Express, PostgreSQL',
          repoUrl: 'https://github.com/example/smartlab-booking',
          status: ProposalStatus.SUBMITTED,
          submittedAt: new Date(),
          revisionCount: 1,
        },
      },
    },
  });

  return {
    course,
    instructor,
    pawarit,
    tatchakorn,
    somchai,
    suda,
    niran,
    teamAlpha,
    teamBeta,
  };
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeded CoursePMS database successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding database:', err);
      process.exit(1);
    });
}
