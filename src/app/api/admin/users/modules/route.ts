export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';
import {
  isGeneralAdmin,
  resolveContractedModules,
  ContractedModules,
  CustomUsageLimits,
  BusinessCollaborator,
} from '../../../../../lib/saas-modules';

interface AdminAuthResult {
  authorized: boolean;
  adminUid?: string;
  adminEmail?: string;
  response?: NextResponse;
}

async function verifyGeneralAdmin(req: Request): Promise<AdminAuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 }),
    };
  }

  const token = authHeader.split('Bearer ')[1];
  if (!adminAuth || !adminDb) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 }),
    };
  }

  const decodedToken = await adminAuth.verifyIdToken(token);
  const adminEmail = (decodedToken.email || '').toLowerCase();

  let role = 'user';
  if (!isGeneralAdmin(adminEmail, null)) {
    const callerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    role = typeof callerData?.role === 'string' ? callerData.role : 'user';
  }

  if (!isGeneralAdmin(adminEmail, role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Acceso denegado: Se requiere rol de Administrador General' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    adminUid: decodedToken.uid,
    adminEmail,
  };
}

export async function GET(req: Request) {
  try {
    const authCheck = await verifyGeneralAdmin(req);
    if (!authCheck.authorized && authCheck.response) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const snapshot = await adminDb.collection('admin_logs').limit(150).get();

    interface AuditLogItem {
      id: string;
      actionType: string;
      targetUserId: string;
      targetEmail: string;
      adminEmail: string;
      summary: string;
      createdAt: string;
    }

    const logs: AuditLogItem[] = [];
    for (const docSnap of snapshot.docs) {
      const d = docSnap.data();
      if (userId && d.targetUserId !== userId) continue;
      logs.push({
        id: docSnap.id,
        actionType: typeof d.actionType === 'string' ? d.actionType : 'update',
        targetUserId: typeof d.targetUserId === 'string' ? d.targetUserId : '',
        targetEmail: typeof d.targetEmail === 'string' ? d.targetEmail : '',
        adminEmail: typeof d.adminEmail === 'string' ? d.adminEmail : '',
        summary: typeof d.summary === 'string' ? d.summary : 'Cambio administrativo',
        createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
      });
    }

    logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ logs: logs.slice(0, 50) }, { status: 200 });
  } catch (error: unknown) {
    console.error('Admin Modules GET Logs Error:', error);
    return NextResponse.json({ error: 'No se pudo consultar el historial' }, { status: 500 });
  }
}

interface AdminModulesPostBody {
  action?:
    | 'update_modules'
    | 'update_commercial'
    | 'create_business'
    | 'add_collaborator'
    | 'remove_collaborator';
  userId?: string;
  profileId?: string;
  contractedModules?: Partial<ContractedModules>;
  // Commercial fields
  name?: string;
  company?: string;
  phone?: string;
  role?: string;
  plan?: string;
  subscriptionStatus?: string;
  planStartDate?: string | null;
  planEndDate?: string | null;
  manualActivation?: boolean;
  commercialNotes?: string;
  customLimits?: CustomUsageLimits;
  // Create business fields
  businessName?: string;
  rubro?: string;
  icon?: string;
  // Collaborator fields
  collaborator?: {
    email?: string;
    name?: string;
    role?: 'owner' | 'collaborator';
    profileIds?: string[];
  };
  collaboratorEmail?: string;
}

export async function POST(req: Request) {
  try {
    const authCheck = await verifyGeneralAdmin(req);
    if (!authCheck.authorized && authCheck.response) return authCheck.response;

    const body = (await req.json()) as AdminModulesPostBody;
    const { action = 'update_modules', userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId del cliente' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const userData = userSnap.data() || {};
    const nowIso = new Date().toISOString();
    const rawProfiles: Array<Record<string, unknown>> = Array.isArray(userData.profiles)
      ? userData.profiles
      : [];

    if (action === 'update_modules') {
      const currentModules = resolveContractedModules(
        {
          plan: typeof userData.plan === 'string' ? userData.plan : 'free',
          contractedModules: userData.contractedModules || null,
          menuDigitalEnabled: Boolean(userData.menuDigitalEnabled),
          fidelizacionEnabled: Boolean(userData.fidelizacionEnabled),
        },
        rawProfiles[0] as { menuDigitalEnabled?: boolean; fidelizacionEnabled?: boolean } | undefined
      );

      const nextModules: ContractedModules = {
        marketing:
          typeof body.contractedModules?.marketing === 'boolean'
            ? body.contractedModules.marketing
            : currentModules.marketing,
        qr:
          typeof body.contractedModules?.qr === 'boolean'
            ? body.contractedModules.qr
            : currentModules.qr,
        fideliza:
          typeof body.contractedModules?.fideliza === 'boolean'
            ? body.contractedModules.fideliza
            : currentModules.fideliza,
      };

      const targetProfileId = body.profileId;
      let updatedProfiles = rawProfiles;

      if (updatedProfiles.length === 0) {
        updatedProfiles = [
          {
            id: 'default',
            name: userData.company || userData.name || 'Mi Negocio',
            icon: '🏢',
            menuDigitalEnabled: nextModules.qr,
            fidelizacionEnabled: nextModules.fideliza,
            contractedModules: nextModules,
          },
        ];
      } else {
        updatedProfiles = updatedProfiles.map((p) => {
          const pId = typeof p.id === 'string' ? p.id : 'default';
          if (targetProfileId && pId !== targetProfileId) {
            return p;
          }
          const existingFidelizaCfg =
            p.fidelizacionConfig && typeof p.fidelizacionConfig === 'object'
              ? (p.fidelizacionConfig as Record<string, unknown>)
              : {
                  programName: `Club ${p.name || userData.name || 'VIP'}`,
                  mode: 'visits',
                  targetGoal: 6,
                  rewardTitle: 'Recompensa Especial',
                  welcomeBonus: true,
                  maxOnePerDay: true,
                  allowPinValidation: true,
                  cashierPin: '1234',
                  primaryColor: '#FF6B00',
                  stampIcon: 'star',
                };

          return {
            ...p,
            contractedModules: nextModules,
            menuDigitalEnabled: nextModules.qr,
            fidelizacionEnabled: nextModules.fideliza,
            fidelizacionConfig: {
              ...existingFidelizaCfg,
              enabled: nextModules.fideliza,
            },
          };
        });
      }

      const updatePayload: Record<string, unknown> = {
         profiles: updatedProfiles,
         updatedAt: nowIso,
      };

      // Si no se especificó un negocio secundario aislado o es el negocio principal, sincronizamos también a nivel cuenta
      if (!targetProfileId || targetProfileId === 'default' || updatedProfiles.length === 1) {
        updatePayload.contractedModules = nextModules;
        updatePayload.menuDigitalEnabled = nextModules.qr;
        updatePayload.fidelizacionEnabled = nextModules.fideliza;
      }

      await userRef.update(updatePayload);

      const summary = `Módulos actualizados${
        targetProfileId ? ` (Negocio: ${targetProfileId})` : ''
      }: Marketing=${nextModules.marketing ? 'ACTIVO' : 'INACTIVO'}, Carta QR=${
        nextModules.qr ? 'ACTIVO' : 'INACTIVO'
      }, Fideliza=${nextModules.fideliza ? 'ACTIVO' : 'INACTIVO'}`;

      await adminDb.collection('admin_logs').add({
        actionType: 'update_modules',
        targetUserId: userId,
        targetEmail: userData.email || '',
        adminUid: authCheck.adminUid,
        adminEmail: authCheck.adminEmail,
        summary,
        previousState: currentModules,
        newState: nextModules,
        createdAt: nowIso,
      });

      return NextResponse.json({
        success: true,
        contractedModules: nextModules,
        message: summary,
      });
    }

    if (action === 'update_commercial') {
      const updateData: Record<string, unknown> = {
        updatedAt: nowIso,
      };

      if (typeof body.name === 'string') updateData.name = body.name.trim();
      if (typeof body.company === 'string') updateData.company = body.company.trim();
      if (typeof body.phone === 'string') updateData.phone = body.phone.trim();
      if (typeof body.role === 'string') updateData.role = body.role;
      if (typeof body.plan === 'string') updateData.plan = body.plan;
      if (typeof body.subscriptionStatus === 'string') {
        updateData.subscriptionStatus = body.subscriptionStatus;
        updateData.isDisabled = body.subscriptionStatus === 'suspended';
      }
      if (body.planStartDate !== undefined) updateData.planStartDate = body.planStartDate;
      if (body.planEndDate !== undefined) updateData.planEndDate = body.planEndDate;
      if (typeof body.manualActivation === 'boolean') {
        updateData.manualActivation = body.manualActivation;
      }
      if (typeof body.commercialNotes === 'string') {
        updateData.commercialNotes = body.commercialNotes;
      }
      if (body.customLimits && typeof body.customLimits === 'object') {
        updateData.customLimits = body.customLimits;
      }
      if (body.contractedModules && typeof body.contractedModules === 'object') {
        const nextMods: ContractedModules = {
          marketing: Boolean(body.contractedModules.marketing),
          qr: Boolean(body.contractedModules.qr),
          fideliza: Boolean(body.contractedModules.fideliza),
        };
        updateData.contractedModules = nextMods;
        updateData.menuDigitalEnabled = nextMods.qr;
        updateData.fidelizacionEnabled = nextMods.fideliza;
      }

      await userRef.update(updateData);

      const summary = `Condiciones comerciales actualizadas: Plan=${
        body.plan || userData.plan || 'free'
      }, Estado=${body.subscriptionStatus || userData.subscriptionStatus || 'active'}${
        body.planEndDate ? `, Vigencia hasta ${body.planEndDate.slice(0, 10)}` : ''
      }`;

      await adminDb.collection('admin_logs').add({
        actionType: 'update_commercial',
        targetUserId: userId,
        targetEmail: userData.email || '',
        adminUid: authCheck.adminUid,
        adminEmail: authCheck.adminEmail,
        summary,
        newState: updateData,
        createdAt: nowIso,
      });

      return NextResponse.json({
        success: true,
        message: 'Condiciones comerciales guardadas correctamente.',
      });
    }

    if (action === 'create_business') {
      const businessName = (body.businessName || '').trim();
      if (!businessName) {
        return NextResponse.json(
          { error: 'Debes indicar el nombre del nuevo negocio' },
          { status: 400 }
        );
      }

      const defaultMods = resolveContractedModules(
        {
          plan: typeof userData.plan === 'string' ? userData.plan : 'free',
          contractedModules: userData.contractedModules || null,
        },
        null
      );

      const newMods: ContractedModules = {
        marketing: body.contractedModules?.marketing ?? defaultMods.marketing,
        qr: body.contractedModules?.qr ?? defaultMods.qr,
        fideliza: body.contractedModules?.fideliza ?? defaultMods.fideliza,
      };

      const newProfileId = `prof_${Date.now()}`;
      const newProfile: Record<string, unknown> = {
        id: newProfileId,
        name: businessName,
        businessName,
        icon: body.icon || (newMods.qr ? '🍽️' : newMods.fideliza ? '🎁' : '🏢'),
        rubro: (body.rubro || '').trim(),
        menuDigitalEnabled: newMods.qr,
        fidelizacionEnabled: newMods.fideliza,
        contractedModules: newMods,
        fidelizacionConfig: {
          enabled: newMods.fideliza,
          programName: `Club ${businessName}`,
          mode: 'visits',
          targetGoal: 6,
          rewardTitle: 'Recompensa Especial',
          welcomeBonus: true,
          maxOnePerDay: true,
          allowPinValidation: true,
          cashierPin: '1234',
          primaryColor: '#FF6B00',
          stampIcon: 'star',
        },
      };

      const nextProfiles = [...rawProfiles, newProfile];
      await userRef.update({
        profiles: nextProfiles,
        updatedAt: nowIso,
      });

      const summary = `Nuevo negocio creado para el cliente: "${businessName}" (${newProfileId})`;
      await adminDb.collection('admin_logs').add({
        actionType: 'create_business',
        targetUserId: userId,
        targetEmail: userData.email || '',
        adminUid: authCheck.adminUid,
        adminEmail: authCheck.adminEmail,
        summary,
        newState: newProfile,
        createdAt: nowIso,
      });

      return NextResponse.json({
        success: true,
        profile: newProfile,
        message: summary,
      });
    }

    if (action === 'add_collaborator') {
      const collabEmail = (body.collaborator?.email || '').trim().toLowerCase();
      if (!collabEmail || !collabEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Ingresa un correo válido para el colaborador' },
          { status: 400 }
        );
      }

      const existingCollabs: BusinessCollaborator[] = Array.isArray(userData.collaborators)
        ? userData.collaborators
        : [];

      const filtered = existingCollabs.filter((c) => c.email.toLowerCase() !== collabEmail);
      const newCollab: BusinessCollaborator = {
        email: collabEmail,
        name: (body.collaborator?.name || collabEmail.split('@')[0]).trim(),
        role: body.collaborator?.role === 'owner' ? 'owner' : 'collaborator',
        profileIds: body.collaborator?.profileIds || ['*'],
        addedAt: nowIso,
        addedBy: authCheck.adminEmail,
      };

      const nextCollabs = [...filtered, newCollab];
      await userRef.update({
        collaborators: nextCollabs,
        updatedAt: nowIso,
      });

      const summary = `Usuario asociado al negocio: ${collabEmail} (${newCollab.role})`;
      await adminDb.collection('admin_logs').add({
        actionType: 'add_collaborator',
        targetUserId: userId,
        targetEmail: userData.email || '',
        adminUid: authCheck.adminUid,
        adminEmail: authCheck.adminEmail,
        summary,
        newState: newCollab,
        createdAt: nowIso,
      });

      return NextResponse.json({
        success: true,
        collaborators: nextCollabs,
        message: summary,
      });
    }

    if (action === 'remove_collaborator') {
      const targetEmail = (body.collaboratorEmail || '').trim().toLowerCase();
      const existingCollabs: BusinessCollaborator[] = Array.isArray(userData.collaborators)
        ? userData.collaborators
        : [];
      const nextCollabs = existingCollabs.filter((c) => c.email.toLowerCase() !== targetEmail);

      await userRef.update({
        collaborators: nextCollabs,
        updatedAt: nowIso,
      });

      const summary = `Colaborador desvinculado: ${targetEmail}`;
      await adminDb.collection('admin_logs').add({
        actionType: 'remove_collaborator',
        targetUserId: userId,
        targetEmail: userData.email || '',
        adminUid: authCheck.adminUid,
        adminEmail: authCheck.adminEmail,
        summary,
        createdAt: nowIso,
      });

      return NextResponse.json({
        success: true,
        collaborators: nextCollabs,
        message: summary,
      });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Admin Modules POST Error:', error);
    const msg = error instanceof Error ? error.message : 'Error al procesar cambio administrativo';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
