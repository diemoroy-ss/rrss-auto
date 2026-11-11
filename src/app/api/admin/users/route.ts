export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import {
  isGeneralAdmin,
  resolveContractedModules,
  ContractedModules,
  CustomUsageLimits,
  BusinessCollaborator,
} from '../../../../lib/saas-modules';

interface FirestoreTimestampLike {
  toDate?: () => Date;
  _seconds?: number;
  seconds?: number;
}

function normalizeDateString(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toISOString();
  if (typeof val === 'object' && val !== null) {
    const ts = val as FirestoreTimestampLike;
    if (typeof ts.toDate === 'function') {
      return ts.toDate().toISOString();
    }
    const secs = ts._seconds ?? ts.seconds;
    if (typeof secs === 'number') {
      return new Date(secs * 1000).toISOString();
    }
  }
  return null;
}

interface RawProfileData {
  id?: string;
  name?: string;
  businessName?: string;
  icon?: string;
  rubro?: string;
  businessType?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  website?: string;
  instagramUsername?: string;
  facebookPageName?: string;
  menuDigitalEnabled?: boolean;
  fidelizacionEnabled?: boolean;
  fidelizacionConfig?: { enabled?: boolean };
  contractedModules?: Partial<ContractedModules>;
  isTestProfile?: boolean;
}

interface AdminCallerAuthResult {
  authorized: boolean;
  adminUid?: string;
  adminEmail?: string;
  response?: NextResponse;
}

async function verifyGeneralAdminCaller(req: Request): Promise<AdminCallerAuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 }),
    };
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!adminAuth || !adminDb) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error:
            'Error 500: Firebase Admin No Configurado. Falta la variable FIREBASE_SERVICE_ACCOUNT en el servidor.',
        },
        { status: 500 }
      ),
    };
  }

  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const userEmail = (decodedToken.email || '').toLowerCase();

  let role = 'user';
  if (!isGeneralAdmin(userEmail, null)) {
    const callerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    role = typeof callerData?.role === 'string' ? callerData.role : 'user';
  }

  if (!isGeneralAdmin(userEmail, role)) {
    console.warn(`[ADMIN API] Unauthorized access denied for ${userEmail}`);
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Acceso Prohibido: No eres administrador general de SocialPilot',
          debugEmail: userEmail,
          debugRole: role,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    adminUid: decodedToken.uid,
    adminEmail: userEmail,
  };
}

export async function GET(req: Request) {
  try {
    const authCheck = await verifyGeneralAdminCaller(req);
    if (!authCheck.authorized && authCheck.response) return authCheck.response;

    const usersSnapshot = await adminDb.collection('users').get();

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const allPostsThisMonth = await adminDb
      .collection('social_posts')
      .where('createdAt', '>=', firstDayOfMonth)
      .get();

    const userPostCounts: Record<string, number> = {};
    for (const post of allPostsThisMonth.docs) {
      const postUserId = post.data().userId;
      if (typeof postUserId === 'string') {
        userPostCounts[postUserId] = (userPostCounts[postUserId] || 0) + 1;
      }
    }

    const usersData = usersSnapshot.docs.map((userDoc) => {
      const data = userDoc.data();
      const uId = userDoc.id;

      const rawProfiles: RawProfileData[] = Array.isArray(data.profiles) ? data.profiles : [];
      const realProfiles = rawProfiles.filter(
        (p) => !p.isTestProfile && !(typeof p.id === 'string' && p.id.startsWith('prof_test_'))
      );
      const effectiveProfiles = realProfiles.length > 0 ? realProfiles : rawProfiles;
      const primaryProfile = effectiveProfiles[0] || null;

      const resolvedModules = resolveContractedModules(
        {
          role: typeof data.role === 'string' ? data.role : 'user',
          email: typeof data.email === 'string' ? data.email : '',
          plan: typeof data.plan === 'string' ? data.plan : 'free',
          contractedModules: data.contractedModules || null,
          menuDigitalEnabled: Boolean(data.menuDigitalEnabled),
          fidelizacionEnabled: Boolean(data.fidelizacionEnabled),
        },
        primaryProfile
      );

      const formattedProfiles = effectiveProfiles.map((p) => {
        const pId = p.id || 'default';
        const pModules = resolveContractedModules(
          {
            plan: typeof data.plan === 'string' ? data.plan : 'free',
            contractedModules: data.contractedModules || null,
          },
          p
        );
        return {
          id: pId,
          name: p.businessName || p.name || data.company || data.name || 'Mi Negocio',
          icon: p.icon || '🏢',
          rubro: p.rubro || p.businessType || '',
          phone: p.whatsapp || p.phone || '',
          email: p.email || '',
          instagramUsername: p.instagramUsername || '',
          facebookPageName: p.facebookPageName || '',
          menuDigitalEnabled: Boolean(p.menuDigitalEnabled || pModules.qr),
          fidelizacionEnabled: Boolean(
            p.fidelizacionEnabled || p.fidelizacionConfig?.enabled || pModules.fideliza
          ),
          contractedModules: pModules,
        };
      });

      const collaborators: BusinessCollaborator[] = Array.isArray(data.collaborators)
        ? data.collaborators
        : [];

      const customLimits: CustomUsageLimits =
        data.customLimits && typeof data.customLimits === 'object' ? data.customLimits : {};

      return {
        id: uId,
        email: typeof data.email === 'string' ? data.email : 'Sin correo',
        name: typeof data.name === 'string' ? data.name : 'Sin Nombre',
        company:
          typeof data.company === 'string'
            ? data.company
            : formattedProfiles[0]?.name || '',
        phone: typeof data.phone === 'string' ? data.phone : formattedProfiles[0]?.phone || '',
        plan: typeof data.plan === 'string' ? data.plan : 'free',
        role: typeof data.role === 'string' ? data.role : 'user',
        planStartDate: normalizeDateString(data.planStartDate || data.createdAt),
        planEndDate: normalizeDateString(data.planEndDate || data.planExpiry),
        createdAt: normalizeDateString(data.createdAt),
        lastLoginAt: normalizeDateString(data.lastLoginAt || data.updatedAt),
        subscriptionStatus:
          typeof data.subscriptionStatus === 'string'
            ? data.subscriptionStatus
            : data.isDisabled
            ? 'suspended'
            : 'active',
        manualActivation: Boolean(data.manualActivation),
        commercialNotes: typeof data.commercialNotes === 'string' ? data.commercialNotes : '',
        customLimits,
        isDisabled: Boolean(data.isDisabled),
        registeredApps: Array.isArray(data.registeredApps) ? data.registeredApps : [],
        postsThisMonth: userPostCounts[uId] || 0,
        contractedModules: resolvedModules,
        profiles:
          formattedProfiles.length > 0
            ? formattedProfiles
            : [
                {
                  id: 'default',
                  name:
                    typeof data.company === 'string' && data.company
                      ? data.company
                      : typeof data.name === 'string' && data.name
                      ? data.name
                      : 'Negocio Principal',
                  icon: '🏢',
                  rubro: '',
                  phone: typeof data.phone === 'string' ? data.phone : '',
                  email: typeof data.email === 'string' ? data.email : '',
                  instagramUsername: '',
                  facebookPageName: '',
                  menuDigitalEnabled: resolvedModules.qr,
                  fidelizacionEnabled: resolvedModules.fideliza,
                  contractedModules: resolvedModules,
                },
              ],
        collaborators,
      };
    });

    return NextResponse.json({ users: usersData }, { status: 200 });
  } catch (error: unknown) {
    console.error('Admin Users GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

interface CreateClientRequestBody {
  email?: string;
  password?: string;
  name?: string;
  businessName?: string;
  rubro?: string;
  phone?: string;
  plan?: string;
  role?: string;
  contractedModules?: Partial<ContractedModules>;
  planStartDate?: string | null;
  planEndDate?: string | null;
  commercialNotes?: string;
  customLimits?: CustomUsageLimits;
}

export async function POST(req: Request) {
  try {
    const authCheck = await verifyGeneralAdminCaller(req);
    if (!authCheck.authorized && authCheck.response) return authCheck.response;

    const body = (await req.json()) as CreateClientRequestBody;
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();
    const businessName = (body.businessName || name || 'Mi Negocio').trim();
    const rubro = (body.rubro || 'Comercio / Gastronomía').trim();
    const phone = (body.phone || '').trim();
    const plan = (body.plan || 'esencial').trim();
    const role = body.role === 'admin' || body.role === 'vendedor' ? body.role : 'owner';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Debes ingresar un correo electrónico válido para el cliente.' },
        { status: 400 }
      );
    }

    const contractedModules: ContractedModules = {
      marketing: body.contractedModules?.marketing ?? true,
      qr: body.contractedModules?.qr ?? false,
      fideliza: body.contractedModules?.fideliza ?? false,
    };

    // Check if user already exists in Firebase Auth or create a new Auth account
    let targetUid = '';
    try {
      const existingAuthUser = await adminAuth.getUserByEmail(email);
      targetUid = existingAuthUser.uid;
    } catch {
      const initialPassword =
        body.password && body.password.trim().length >= 6
          ? body.password.trim()
          : `SP-${Math.random().toString(36).slice(2, 8)}!2026`;

      const createdAuthUser = await adminAuth.createUser({
        email,
        password: initialPassword,
        displayName: name || businessName,
      });
      targetUid = createdAuthUser.uid;
    }

    const nowIso = new Date().toISOString();
    const initialProfile = {
      id: 'default',
      name: businessName,
      businessName,
      icon: contractedModules.qr ? '🍽️' : contractedModules.fideliza ? '🎁' : '🏢',
      rubro,
      phone,
      whatsapp: phone,
      email,
      menuDigitalEnabled: contractedModules.qr,
      fidelizacionEnabled: contractedModules.fideliza,
      fidelizacionConfig: {
        enabled: contractedModules.fideliza,
        programName: `Club ${businessName}`,
        mode: 'visits',
        targetGoal: 6,
        rewardTitle: 'Recompensa Especial',
        rewardDescription: 'Presenta tu código al completar tus visitas en el local.',
        welcomeBonus: true,
        instagramBonus: false,
        maxOnePerDay: true,
        allowPinValidation: true,
        cashierPin: '1234',
        allowReceiptOcr: false,
        allowWhatsappApproval: true,
        primaryColor: '#FF6B00',
        stampIcon: 'star',
      },
      contractedModules,
    };

    const userDocRef = adminDb.collection('users').doc(targetUid);
    const existingDoc = await userDocRef.get();

    const userPayload: Record<string, unknown> = {
      email,
      name: name || businessName,
      company: businessName,
      phone,
      role,
      plan,
      contractedModules,
      menuDigitalEnabled: contractedModules.qr,
      fidelizacionEnabled: contractedModules.fideliza,
      planStartDate: body.planStartDate || nowIso,
      planEndDate: body.planEndDate || null,
      subscriptionStatus: 'active',
      manualActivation: true,
      commercialNotes: body.commercialNotes || '',
      customLimits: body.customLimits || {},
      isDisabled: false,
      updatedAt: nowIso,
    };

    if (!existingDoc.exists) {
      userPayload.createdAt = nowIso;
      userPayload.profiles = [initialProfile];
      userPayload.collaborators = [];
      await userDocRef.set(userPayload);
    } else {
      const existingData = existingDoc.data() || {};
      const existingProfiles = Array.isArray(existingData.profiles) ? existingData.profiles : [];
      if (existingProfiles.length === 0) {
        userPayload.profiles = [initialProfile];
      }
      await userDocRef.set(userPayload, { merge: true });
    }

    await adminDb.collection('admin_logs').add({
      actionType: 'create_client',
      targetUserId: targetUid,
      targetEmail: email,
      adminUid: authCheck.adminUid,
      adminEmail: authCheck.adminEmail,
      summary: `Cliente creado/configurado (${businessName}) con módulos: Marketing=${contractedModules.marketing}, QR=${contractedModules.qr}, Fideliza=${contractedModules.fideliza}`,
      newState: {
        plan,
        contractedModules,
        businessName,
      },
      createdAt: nowIso,
    });

    return NextResponse.json(
      {
        success: true,
        userId: targetUid,
        message: `Cliente ${businessName} (${email}) registrado correctamente.`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Admin Users POST Error:', error);
    const errMsg = error instanceof Error ? error.message : 'No se pudo crear el cliente';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
