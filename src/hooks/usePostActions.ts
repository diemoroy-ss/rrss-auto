import { useCallback } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import { auth, db } from "../lib/firebase";
import { SocialPost } from "../types/dashboard";

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  desc: string;
  confirmText: string;
  cancelText: string;
  isDanger: boolean;
  onConfirm: () => void;
  secondaryAction?: { text: string; onClick: () => void };
}

interface PublishResult {
  isOpen: boolean;
  success: boolean;
  published: string[];
  errors: string | null;
}

interface StoryFormatWarning {
  isOpen: boolean;
  post: SocialPost;
  imageUrl: string;
}

export interface UsePostActionsDeps {
  posts: SocialPost[];
  blogPosts: SocialPost[];
  selectedPost: SocialPost | null;
  userPlan: string;
  quotaUsed: number;
  planLimit: number;
  activeProfile: any;
  filteredPosts: SocialPost[];
  updatePostInCache: (postId: string, updates: Partial<SocialPost>, isBlog?: boolean) => void;
  removePostFromCache: (postId: string, isBlog?: boolean) => void;
  setQuotaUsed: React.Dispatch<React.SetStateAction<number>>;
  setSelectedPost: React.Dispatch<React.SetStateAction<SocialPost | null>>;
  setMessage: React.Dispatch<React.SetStateAction<{ type: "success" | "error" | "info"; text: string } | null>>;
  setUpgradeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmModalState: React.Dispatch<React.SetStateAction<ConfirmModalState | null>>;
  setRescheduleData: React.Dispatch<React.SetStateAction<{ id: string; date: string } | null>>;
  setPublishResult: React.Dispatch<React.SetStateAction<PublishResult | null>>;
  setStoryFormatWarning: React.Dispatch<React.SetStateAction<StoryFormatWarning | null>>;
  setSelectedPostIds: React.Dispatch<React.SetStateAction<string[]>>;
  setIsUpdatingStatus: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConfirmingAll: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCancellingAll: React.Dispatch<React.SetStateAction<boolean>>;
  setPublishingPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsPublishingStory: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRegeneratingStoryMedia: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUploadingBaseImage: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGeneratingStyledImage: React.Dispatch<React.SetStateAction<boolean>>;
  rescheduleData: { id: string; date: string } | null;
  storyFormatWarning: StoryFormatWarning | null;
  selectedPostIds: string[];
}

/**
 * usePostActions
 *
 * Consolida todos los handlers asíncronos del dashboard de posts.
 * Ninguna función tiene estado propio — todo el estado vive en page.tsx
 * y se pasa como deps para mantener la fuente de verdad centralizada.
 */
export function usePostActions(deps: UsePostActionsDeps) {
  const {
    posts, blogPosts, selectedPost, userPlan, quotaUsed, planLimit,
    activeProfile, filteredPosts, selectedPostIds, rescheduleData,
    storyFormatWarning, updatePostInCache, removePostFromCache,
    setQuotaUsed, setSelectedPost, setMessage, setUpgradeModalOpen,
    setConfirmModalState, setRescheduleData, setPublishResult,
    setStoryFormatWarning, setSelectedPostIds, setIsUpdatingStatus,
    setIsConfirmingAll, setIsCancellingAll, setPublishingPostId,
    setIsPublishingStory, setIsRegeneratingStoryMedia,
    setIsUploadingBaseImage, setIsGeneratingStyledImage,
  } = deps;

  // --- Utilidad: modal de confirmación genérico ---
  const requestConfirmation = useCallback(
    (
      title: string,
      desc: string,
      onConfirm: () => void,
      isDanger = false,
      secondaryAction?: { text: string; onClick: () => void }
    ) => {
      setConfirmModalState({
        isOpen: true,
        title,
        desc,
        confirmText: isDanger ? "Sí, eliminar" : "Sí, continuar",
        cancelText: "Cancelar",
        isDanger,
        onConfirm,
        secondaryAction,
      });
    },
    [setConfirmModalState]
  );

  // --- Imagen: resetear estado "generando" trabado ---
  const handleResetGeneratingState = useCallback(
    async (postId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      try {
        await updateDoc(doc(db, "social_posts", postId), { isGeneratingImage: false });
        updatePostInCache(postId, { isGeneratingImage: false });
      } catch (err) {
        console.error(err);
      }
    },
    [updatePostInCache]
  );

  // --- Imagen: lanzar generación de media ---
  const handleGenerateMedia = useCallback(
    async (postId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      try {
        const post = posts.find((p) => p.id === postId);
        if (!post) return;

        updatePostInCache(postId, { isGeneratingImage: true });

        const isReel =
          post.type === "Reel" ||
          post.type === "video_reel" ||
          (post.format && post.format.toLowerCase().includes("reel"));

        if (isReel && userPlan !== "premium") {
          const res = await fetch("/api/poc/video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic: post.idea || post.text,
              rubro: activeProfile?.rubro || "General",
            }),
          });
          if (!res.ok) throw new Error("Error contactando al generador de guiones.");
          const data = await res.json();
          if (data.composition) {
            const comp = data.composition;
            await updateDoc(doc(db, "social_posts", postId), {
              scenes: comp.scenes,
              audioScript: comp.audioScript,
              copy: comp.copyText,
              isGeneratingImage: false,
            });
            updatePostInCache(postId, {
              scenes: comp.scenes,
              audioScript: comp.audioScript,
              copy: comp.copyText,
              isGeneratingImage: false,
            });
            return;
          }
        }

        const res = await fetch("/api/n8n/request-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });
        if (!res.ok) {
          updatePostInCache(postId, { isGeneratingImage: false });
          setMessage({ type: "error", text: "Hubo un error contactando al motor de IA." });
        }
      } catch (err) {
        console.error(err);
        updatePostInCache(postId, { isGeneratingImage: false });
      }
    },
    [posts, userPlan, activeProfile, updatePostInCache, setMessage]
  );

  // --- Imagen base: subir ---
  const handleUploadBaseImage = useCallback(
    async (postId: string, file: File) => {
      const user = auth.currentUser;
      if (!user || !file) return;
      setIsUploadingBaseImage(true);
      try {
        const token = await user.getIdToken();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("postId", postId);

        const res = await fetch("/api/posts/upload-base-image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "No se pudo subir la imagen base.");

        updatePostInCache(postId, { baseImageUrl: data.baseImageUrl });
        setMessage({ type: "success", text: "Imagen base cargada correctamente." });
      } catch (err: any) {
        console.error(err);
        setMessage({ type: "error", text: err.message || "Error al subir la imagen base." });
      } finally {
        setIsUploadingBaseImage(false);
      }
    },
    [updatePostInCache, setMessage, setIsUploadingBaseImage]
  );

  // --- Imagen base: eliminar ---
  const handleRemoveBaseImage = useCallback(
    async (postId: string) => {
      try {
        await updateDoc(doc(db, "social_posts", postId), { baseImageUrl: null });
        updatePostInCache(postId, { baseImageUrl: undefined });
        setMessage({ type: "info", text: "Imagen base eliminada del post." });
      } catch (err: any) {
        console.error(err);
      }
    },
    [updatePostInCache, setMessage]
  );

  // --- Imagen con estilo visual: generar ---
  const handleGenerateStyledImage = useCallback(
    async (postId: string) => {
      const user = auth.currentUser;
      if (!user) return;
      setIsGeneratingStyledImage(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/posts/generate-styled-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ postId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "No se pudo generar la imagen con estilo visual.");

        updatePostInCache(postId, {
          imageUrl: data.imageUrl,
          imageUrls: [data.imageUrl],
          baseImageUrl: data.baseImageUrl,
          imageSource: data.imageSource,
        });
        setMessage({ type: "success", text: `¡Diseño generado con éxito! ${data.sourceDescription || ""}` });
      } catch (err: any) {
        console.error(err);
        setMessage({ type: "error", text: err.message || "Error al generar la imagen con estilo." });
      } finally {
        setIsGeneratingStyledImage(false);
      }
    },
    [updatePostInCache, setMessage, setIsGeneratingStyledImage]
  );

  // --- Post: borrar ---
  const handleDelete = useCallback(
    (postId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const post = posts.find((p) => p.id === postId);
      const isPublished = post?.status === "published";

      requestConfirmation(
        isPublished ? "¿Ocultar historial?" : "¿Cancelar agendamiento?",
        isPublished
          ? "Esto ocultará el post de esta pantalla local, pero no lo borrará de tus redes sociales activas."
          : "Esta acción borrará el post definitivamente y el bot no lo publicará.",
        async () => {
          try {
            await deleteDoc(doc(db, "social_posts", postId));
            removePostFromCache(postId);
            setConfirmModalState(null);
          } catch {
            setMessage({ type: "error", text: "Error al borrar." });
            setConfirmModalState(null);
          }
        },
        true
      );
    },
    [posts, requestConfirmation, removePostFromCache, setConfirmModalState, setMessage]
  );

  // --- Post: borrar (modal de detalle, soporta blog) ---
  const handleDeletePost = useCallback(
    (postId: string) => {
      const postToDelete = [...posts, ...blogPosts].find((p) => p.id === postId);
      const isBlog = postToDelete?.networks?.includes("blog");
      const collectionName = isBlog ? "blog_posts" : "social_posts";

      requestConfirmation(
        "¿Eliminar Publicación?",
        "¿Estás seguro de que deseas eliminar permanentemente esta publicación programada?",
        async () => {
          setConfirmModalState(null);
          try {
            await deleteDoc(doc(db, collectionName, postId));
            removePostFromCache(postId, isBlog);
            setMessage({ type: "success", text: "Publicación eliminada correctamente." });
          } catch {
            setMessage({ type: "error", text: "Error al eliminar la publicación." });
          }
        },
        true
      );
    },
    [posts, blogPosts, requestConfirmation, removePostFromCache, setConfirmModalState, setMessage]
  );

  // --- Post: confirmar (agenda en GCP Tasks) ---
  const handleConfirm = useCallback(
    async (post: SocialPost) => {
      if (quotaUsed + (post.networks?.length || 1) > planLimit) {
        setUpgradeModalOpen(true);
        return;
      }
      try {
        setIsUpdatingStatus(true);
        await updateDoc(doc(db, "social_posts", post.id), { status: "confirmed", publishError: null });
        updatePostInCache(post.id, { status: "confirmed", publishError: undefined });
        setQuotaUsed((prev) => prev + (post.networks?.length || 1));

        const idToken = await auth.currentUser?.getIdToken();
        if (post.scheduledFor && idToken) {
          const dateObj =
            typeof post.scheduledFor.toDate === "function"
              ? post.scheduledFor.toDate()
              : new Date(post.scheduledFor);
          await fetch("/api/tasks/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ postId: post.id, scheduledFor: dateObj.toISOString() }),
          });
        }
        setSelectedPost(null);
      } catch {
        setMessage({ type: "error", text: "Error al confirmar el agendamiento." });
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [quotaUsed, planLimit, updatePostInCache, setQuotaUsed, setSelectedPost, setMessage,
      setUpgradeModalOpen, setIsUpdatingStatus]
  );

  // --- Post: desconfirmar ---
  const handleUnconfirm = useCallback(
    async (post: SocialPost, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      try {
        setIsUpdatingStatus(true);
        await updateDoc(doc(db, "social_posts", post.id), { status: "pending", publishError: null });
        updatePostInCache(post.id, { status: "pending", publishError: undefined });
        setQuotaUsed((prev) => Math.max(0, prev - (post.networks?.length || 1)));
        setSelectedPost(null);
      } catch {
        setMessage({ type: "error", text: "Error al desconfirmar el post." });
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [updatePostInCache, setQuotaUsed, setSelectedPost, setMessage, setIsUpdatingStatus]
  );

  // --- Red social: toggle ---
  const toggleNetwork = useCallback(
    async (post: SocialPost, network: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        let newNetworks = [...post.networks];
        if (newNetworks.includes(network)) {
          if (newNetworks.length <= 1) {
            setMessage({ type: "error", text: "Debes seleccionar al menos una red social." });
            return;
          }
          newNetworks = newNetworks.filter((n) => n !== network);
        } else {
          newNetworks.push(network);
        }
        await updateDoc(doc(db, "social_posts", post.id), { networks: newNetworks });
        updatePostInCache(post.id, { networks: newNetworks });
        if (post.status === "confirmed") {
          setQuotaUsed((prev) => prev + (newNetworks.length - post.networks.length));
        }
      } catch {
        setMessage({ type: "error", text: "Error al cambiar las redes sociales." });
      }
    },
    [updatePostInCache, setQuotaUsed, setMessage]
  );

  // --- Formato: cambiar tipo de post ---
  const handleChangeType = useCallback(
    async (post: SocialPost, newType: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await updateDoc(doc(db, "social_posts", post.id), { type: newType });
        updatePostInCache(post.id, { type: newType });
      } catch {
        setMessage({ type: "error", text: "Error al cambiar el formato." });
      }
    },
    [updatePostInCache, setMessage]
  );

  // --- Carrusel: cambiar cantidad de imágenes ---
  const handleChangeCarouselCount = useCallback(
    async (post: SocialPost, newCount: number) => {
      try {
        await updateDoc(doc(db, "social_posts", post.id), { carouselCount: newCount });
        updatePostInCache(post.id, { carouselCount: newCount });
      } catch {
        setMessage({ type: "error", text: "Error al cambiar cantidad del carrusel." });
      }
    },
    [updatePostInCache, setMessage]
  );

  // --- Bulk: confirmar todos los pendientes ---
  const handleConfirmAll = useCallback(async () => {
    const pendingPosts = posts.filter((p) => p.status === "pending");
    if (pendingPosts.length === 0) return;
    const totalPendingNetworks = pendingPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);
    if (quotaUsed + totalPendingNetworks > planLimit) {
      setUpgradeModalOpen(true);
      return;
    }
    requestConfirmation(
      "¿Confirmar todos?",
      `¿Deseas que Santisoft agende y publique tus ${pendingPosts.length} posts en piloto automático?`,
      async () => {
        setIsConfirmingAll(true);
        setConfirmModalState(null);
        try {
          await Promise.all(pendingPosts.map((p) => updateDoc(doc(db, "social_posts", p.id), { status: "confirmed" })));
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            await Promise.allSettled(
              pendingPosts.map(async (p) => {
                if (!p.scheduledFor) return;
                const dateObj =
                  typeof p.scheduledFor.toDate === "function" ? p.scheduledFor.toDate() : new Date(p.scheduledFor);
                return fetch("/api/tasks/schedule", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
                  body: JSON.stringify({ postId: p.id, scheduledFor: dateObj.toISOString() }),
                });
              })
            );
          }
          pendingPosts.forEach((p) => updatePostInCache(p.id, { status: "confirmed" }));
          setQuotaUsed((prev) => prev + totalPendingNetworks);
          setMessage({ type: "success", text: `¡${pendingPosts.length} publicaciones agendadas!` });
        } catch {
          setMessage({ type: "error", text: "Error al confirmar masivamente." });
        } finally {
          setIsConfirmingAll(false);
        }
      }
    );
  }, [posts, quotaUsed, planLimit, requestConfirmation, updatePostInCache, setQuotaUsed,
    setMessage, setUpgradeModalOpen, setIsConfirmingAll, setConfirmModalState]);

  // --- Bulk: confirmar seleccionados ---
  const handleBulkConfirm = useCallback(async () => {
    const selectedPosts = posts.filter((p) => selectedPostIds.includes(p.id) && p.status === "pending");
    if (selectedPosts.length === 0) return;
    const totalNetworks = selectedPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);
    if (quotaUsed + totalNetworks > planLimit) { setUpgradeModalOpen(true); return; }

    setIsConfirmingAll(true);
    try {
      await Promise.all(selectedPosts.map((p) => updateDoc(doc(db, "social_posts", p.id), { status: "confirmed" })));
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        await Promise.allSettled(
          selectedPosts.map(async (p) => {
            if (!p.scheduledFor) return;
            const dateObj = typeof p.scheduledFor.toDate === "function" ? p.scheduledFor.toDate() : new Date(p.scheduledFor);
            return fetch("/api/tasks/schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
              body: JSON.stringify({ postId: p.id, scheduledFor: dateObj.toISOString() }),
            });
          })
        );
      }
      selectedPosts.forEach((p) => updatePostInCache(p.id, { status: "confirmed" }));
      setQuotaUsed((prev) => prev + totalNetworks);
      setSelectedPostIds([]);
      setMessage({ type: "success", text: `${selectedPosts.length} publicaciones confirmadas.` });
    } catch {
      setMessage({ type: "error", text: "Error en confirmación masiva." });
    } finally {
      setIsConfirmingAll(false);
    }
  }, [posts, selectedPostIds, quotaUsed, planLimit, updatePostInCache, setQuotaUsed,
    setMessage, setUpgradeModalOpen, setIsConfirmingAll, setSelectedPostIds]);

  // --- Bulk: cancelar todos los confirmados ---
  const handleCancelAll = useCallback(async () => {
    const confirmedPosts = posts.filter((p) => p.status === "confirmed");
    if (confirmedPosts.length === 0) return;

    requestConfirmation(
      "¿Pausar todas las publicaciones?",
      `Tus ${confirmedPosts.length} publicaciones volverán a ser borradores locales.`,
      async () => {
        setIsCancellingAll(true);
        setConfirmModalState(null);
        try {
          await Promise.all(confirmedPosts.map((p) => updateDoc(doc(db, "social_posts", p.id), { status: "pending" })));
          const totalNetworks = confirmedPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);
          confirmedPosts.forEach((p) => updatePostInCache(p.id, { status: "pending" }));
          setQuotaUsed((prev) => Math.max(0, prev - totalNetworks));
          setSelectedPostIds([]);
        } catch {
          setMessage({ type: "error", text: "Error al desconfirmar masivamente." });
        } finally {
          setIsCancellingAll(false);
        }
      }
    );
  }, [posts, requestConfirmation, updatePostInCache, setQuotaUsed, setSelectedPostIds,
    setMessage, setIsCancellingAll, setConfirmModalState]);

  // --- Bulk: desconfirmar seleccionados ---
  const handleBulkUnconfirm = useCallback(async () => {
    const selectedPosts = posts.filter((p) => selectedPostIds.includes(p.id) && p.status === "confirmed");
    if (selectedPosts.length === 0) return;

    setIsCancellingAll(true);
    try {
      await Promise.all(selectedPosts.map((p) => updateDoc(doc(db, "social_posts", p.id), { status: "pending" })));
      const totalNetworks = selectedPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);
      selectedPosts.forEach((p) => updatePostInCache(p.id, { status: "pending" }));
      setQuotaUsed((prev) => Math.max(0, prev - totalNetworks));
      setSelectedPostIds([]);
    } catch {
      setMessage({ type: "error", text: "Error en pausa masiva." });
    } finally {
      setIsCancellingAll(false);
    }
  }, [posts, selectedPostIds, updatePostInCache, setQuotaUsed, setSelectedPostIds,
    setMessage, setIsCancellingAll]);

  // --- Bulk: borrar seleccionados ---
  const handleBulkDelete = useCallback(async () => {
    if (selectedPostIds.length === 0) return;

    requestConfirmation(
      "¿Borrar seleccionados?",
      `Vas a perder ${selectedPostIds.length} publicaciones para siempre.`,
      async () => {
        setIsCancellingAll(true);
        setConfirmModalState(null);
        try {
          await Promise.all(selectedPostIds.map((id) => deleteDoc(doc(db, "social_posts", id))));
          selectedPostIds.forEach((id) => removePostFromCache(id));
          setSelectedPostIds([]);
          setMessage({ type: "success", text: "Posts eliminados correctamente." });
        } catch {
          setMessage({ type: "error", text: "Error al borrar seleccionados." });
        } finally {
          setIsCancellingAll(false);
        }
      },
      true
    );
  }, [selectedPostIds, requestConfirmation, removePostFromCache, setSelectedPostIds,
    setMessage, setIsCancellingAll, setConfirmModalState]);

  // --- Publicar ahora ---
  const handlePublishNow = useCallback(
    (postId: string) => {
      const postToUpdate = [...posts, ...blogPosts].find((p) => p.id === postId);
      const hasError =
        postToUpdate?.status === "error" ||
        !!postToUpdate?.publishError ||
        selectedPost?.status === "error" ||
        !!selectedPost?.publishError;

      const isTestPost = postToUpdate?.isTestMode || postToUpdate?.testMode;
      const targetNetworksStr = (postToUpdate?.networks || selectedPost?.networks || []).join(", ");

      requestConfirmation(
        isTestPost ? "¿Publicar Ahora (Modo Prueba)?" : "¿Publicar Ahora?",
        isTestPost
          ? `Esta publicación de prueba se enviará de inmediato a las cuentas configuradas de santisoftai@gmail.com (${targetNetworksStr || "redes configuradas"}). ¿Deseas continuar?`
          : "Esta publicación se enviará de inmediato a tus redes sociales configuradas. ¿Deseas continuar?",
        async () => {
          setPublishingPostId(postId);
          setConfirmModalState(null);
          try {
            const res = await fetch("/api/publish-now", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId }),
            });
            const data = await res.json();

            if (res.status === 500 || data.error) {
              const errMsg = data.error || "Error desconocido al publicar";
              setPublishResult({ isOpen: true, success: false, published: [], errors: errMsg });
              setMessage({ type: "error", text: errMsg });
            } else if (data.status === "publishing") {
              setMessage({ type: "success", text: "¡Publicación iniciada! El bot está enviando tu contenido en segundo plano." });
            } else {
              const hasErrors = !!data.errors;
              setPublishResult({
                isOpen: true,
                success: !hasErrors,
                published: data.published || [],
                errors: data.errors || null,
              });
              if (hasErrors) {
                setMessage({ type: "error", text: `Publicación parcial. Errores: ${data.errors}` });
              } else {
                const infoNote = data.info ? ` (Nota: ${data.info})` : "";
                setMessage({ type: "success", text: `¡Publicado con éxito en: ${data.published.join(", ")}!${infoNote}` });
              }
            }
          } catch (err: any) {
            setPublishResult({ isOpen: true, success: false, published: [], errors: err.message || "Error de red al intentar publicar" });
            setMessage({ type: "error", text: err.message || "Error al intentar publicar." });
          } finally {
            setPublishingPostId(null);
          }
        },
        false,
        hasError
          ? {
              text: "Agendar en su lugar",
              onClick: () => {
                setConfirmModalState(null);
                const targetPost = postToUpdate || selectedPost;
                if (targetPost) {
                  const dateObj = targetPost.scheduledFor?.toDate
                    ? targetPost.scheduledFor.toDate()
                    : new Date();
                  setRescheduleData({ id: targetPost.id, date: format(dateObj, "yyyy-MM-dd'T'HH:mm") });
                }
              },
            }
          : undefined
      );
    },
    [posts, blogPosts, selectedPost, requestConfirmation, setPublishingPostId, setConfirmModalState,
      setPublishResult, setMessage, setRescheduleData]
  );

  // --- Publicar como Historia ---
  const checkImageAspectIsVertical = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img.naturalWidth / img.naturalHeight < 0.8);
      img.onerror = () => resolve(true);
    });
  };

  const handlePublishStory = useCallback(
    async (postId: string, forceAsIs = false) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const imageUrl = post.imageUrl || (post.imageUrls && post.imageUrls[0]);

      if (!forceAsIs && imageUrl) {
        const isVertical = await checkImageAspectIsVertical(imageUrl);
        if (!isVertical) {
          setStoryFormatWarning({ isOpen: true, post, imageUrl });
          return;
        }
      }

      requestConfirmation(
        "¿Compartir como Historia?",
        "La imagen de esta publicación se compartirá de inmediato como Historia en tu Instagram Business y Facebook Page. ¿Deseas continuar?",
        async () => {
          setIsPublishingStory(true);
          setConfirmModalState(null);
          try {
            const res = await fetch("/api/publish-story", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudo compartir la historia.");
            setMessage({ type: "success", text: `¡Historia publicada con éxito en: ${data.published.join(", ")}!` });
            setQuotaUsed((prev) => prev + (data.published?.length || 1));
            setSelectedPost(null);
          } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Error al compartir como historia." });
          } finally {
            setIsPublishingStory(false);
          }
        }
      );
    },
    [posts, requestConfirmation, setStoryFormatWarning, setIsPublishingStory, setConfirmModalState,
      setMessage, setQuotaUsed, setSelectedPost]
  );

  // --- Story: regenerar imagen en formato vertical ---
  const handleRegenerateStoryImage = useCallback(
    async (post: SocialPost) => {
      setIsRegeneratingStoryMedia(true);
      try {
        setMessage({ type: "info", text: "Generando nueva imagen vertical 9:16..." });
        const response = await fetch("/api/ai/generate-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea: post.idea || post.copy || "",
            userPlan,
            businessType: activeProfile?.rubro || "",
            type: "Historia",
            carouselCount: 1,
            profileId: activeProfile?.id || "default",
            email: activeProfile?.email || "",
            phone: activeProfile?.phone || "",
          }),
        });
        if (!response.ok) throw new Error("No se pudo regenerar el diseño.");
        const data = await response.json();
        if (!data.imageUrl) throw new Error("La IA no devolvió una imagen válida.");

        await updateDoc(doc(db, "social_posts", post.id), { imageUrl: data.imageUrl });
        updatePostInCache(post.id, { imageUrl: data.imageUrl });
        setMessage({ type: "success", text: "¡Imagen adaptada a formato vertical 9:16 con éxito!" });
        setStoryFormatWarning(null);
        handlePublishStory(post.id, true);
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Error adaptando la imagen." });
      } finally {
        setIsRegeneratingStoryMedia(false);
      }
    },
    [userPlan, activeProfile, updatePostInCache, setMessage, setStoryFormatWarning,
      setIsRegeneratingStoryMedia, handlePublishStory]
  );

  // --- Estado: actualizar status genérico ---
  const handleUpdateStatus = useCallback(
    async (postId: string, newStatus: "pending" | "confirmed") => {
      setIsUpdatingStatus(true);
      try {
        const postToUpdate = [...posts, ...blogPosts].find((p) => p.id === postId);
        const isBlog = postToUpdate?.networks?.includes("blog");
        const collectionName = isBlog ? "blog_posts" : "social_posts";

        await updateDoc(doc(db, collectionName, postId), { status: newStatus, publishError: null });
        updatePostInCache(postId, { status: newStatus, publishError: undefined }, isBlog);

        if (!isBlog && postToUpdate) {
          const networksCount = postToUpdate.networks?.length || 1;
          if (newStatus === "confirmed" && postToUpdate.status === "pending") {
            setQuotaUsed((prev) => prev + networksCount);
          } else if (newStatus === "pending" && postToUpdate.status === "confirmed") {
            setQuotaUsed((prev) => Math.max(0, prev - networksCount));
          }
        }
        setSelectedPost(null);
        setMessage({ type: "success", text: `Estado actualizado a '${newStatus}'.` });
      } catch {
        setMessage({ type: "error", text: "Error al actualizar el estado." });
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [posts, blogPosts, updatePostInCache, setQuotaUsed, setSelectedPost, setMessage, setIsUpdatingStatus]
  );

  // --- Reagendar ---
  const handleSaveReschedule = useCallback(
    async (rescheduleData: { id: string; date: string }) => {
      try {
        const newDate = new Date(rescheduleData.date);
        setIsUpdatingStatus(true);

        const postToUpdate = [...posts, ...blogPosts].find((p) => p.id === rescheduleData.id);
        const isBlog = postToUpdate?.networks?.includes("blog");
        const collectionName = isBlog ? "blog_posts" : "social_posts";
        const newStatus = isBlog ? "strategy_draft" : "confirmed";

        await updateDoc(doc(db, collectionName, rescheduleData.id), {
          scheduledFor: newDate,
          status: newStatus,
          publishError: null,
        });

        if (!isBlog && postToUpdate && postToUpdate.status !== "confirmed") {
          setQuotaUsed((prev) => prev + (postToUpdate.networks?.length || 1));
        }

        const fakeTimestamp = { toDate: () => newDate, toMillis: () => newDate.getTime() } as any;
        updatePostInCache(rescheduleData.id, { scheduledFor: fakeTimestamp, status: newStatus, publishError: undefined }, isBlog);

        if (!isBlog) {
          const idToken = await auth.currentUser?.getIdToken();
          await fetch("/api/tasks/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ postId: rescheduleData.id, scheduledFor: newDate.toISOString() }),
          });
        }

        setMessage({ type: "success", text: "Post reagendado exitosamente." });
        setRescheduleData(null);
      } catch {
        setMessage({ type: "error", text: "Error al reagendar el post." });
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [posts, blogPosts, updatePostInCache, setQuotaUsed, setMessage, setRescheduleData, setIsUpdatingStatus]
  );

  // --- Selección masiva ---
  const toggleSelectAll = useCallback(
    (filteredPostsList: SocialPost[]) => {
      setSelectedPostIds((prev) =>
        prev.length === filteredPostsList.length ? [] : filteredPostsList.map((p) => p.id)
      );
    },
    [setSelectedPostIds]
  );

  const toggleSelectPost = useCallback(
    (postId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setSelectedPostIds((prev) =>
        prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
      );
    },
    [setSelectedPostIds]
  );

  return {
    handleResetGeneratingState,
    handleGenerateMedia,
    handleUploadBaseImage,
    handleRemoveBaseImage,
    handleGenerateStyledImage,
    handleDelete,
    handleDeletePost,
    handleConfirm,
    handleUnconfirm,
    toggleNetwork,
    handleChangeType,
    handleChangeCarouselCount,
    handleConfirmAll,
    handleBulkConfirm,
    handleCancelAll,
    handleBulkUnconfirm,
    handleBulkDelete,
    handlePublishNow,
    handlePublishStory,
    handleRegenerateStoryImage,
    handleUpdateStatus,
    handleSaveReschedule,
    toggleSelectAll,
    toggleSelectPost,
    requestConfirmation,
  };
}

export type PostActionsReturn = ReturnType<typeof usePostActions>;
