"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useChannelsByServerQuery } from "@/src/features/channel/channel.hooks";

export default function ServerRedirectPage() {
  const t = useTranslations("server");
  const params = useParams();
  const router = useRouter();
  const serverIdParam = params?.serverId;
  const serverId =
    typeof serverIdParam === "string" ? parseInt(serverIdParam, 10) : null;

  const { data: channels, isLoading, isError } = useChannelsByServerQuery(
    serverId ?? null,
  );

  useEffect(() => {
    if (serverId == null || Number.isNaN(serverId)) {
      router.replace("/");
      return;
    }
    if (isLoading || channels === undefined) return;
    if (isError || channels.length === 0) {
      router.replace("/");
      return;
    }
    const defaultChannel = channels[0];
    router.replace(`/channels/${defaultChannel.id}`);
  }, [serverId, channels, isLoading, isError, router]);

  return (
    <div style={{ padding: "1rem", fontSize: "0.9rem" }}>
      {t("redirecting")}
    </div>
  );
}
