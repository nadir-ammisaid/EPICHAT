"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Channel } from "@/lib/api/channels";
import { useTranslation } from "react-i18next";

export default function ChannelModals({
  // CREATE
  createOpen,
  onCloseCreate,
  newChannelName,
  setNewChannelName,
  createLoading,
  createError,
  onSubmitCreate,

  // RENAME
  renameOpen,
  onCloseRename,
  renameValue,
  setRenameValue,
  renameLoading,
  renameError,
  onSubmitRename,

  // DELETE
  deleteOpen,
  onCloseDelete,
  deleteLoading,
  deleteError,
  onConfirmDelete,

  selected,
}: {
  // create
  createOpen: boolean;
  onCloseCreate: () => void;
  newChannelName: string;
  setNewChannelName: (v: string) => void;
  createLoading: boolean;
  createError: string | null;
  onSubmitCreate: (e: React.FormEvent) => void;

  // rename
  renameOpen: boolean;
  onCloseRename: () => void;
  renameValue: string;
  setRenameValue: (v: string) => void;
  renameLoading: boolean;
  renameError: string | null;
  onSubmitRename: (e: React.FormEvent) => void;

  // delete
  deleteOpen: boolean;
  onCloseDelete: () => void;
  deleteLoading: boolean;
  deleteError: string | null;
  onConfirmDelete: () => void;

  selected: Channel | null;
}) {
  const { t } = useTranslation("common");

  return (
    <>
      <Modal open={createOpen} onClose={onCloseCreate} title={t("channels.modals.create.title")}>
        <form onSubmit={onSubmitCreate} className="flex flex-col gap-3">
          <Input
            label={t("channels.modals.create.nameLabel")}
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder={t("channels.modals.create.namePlaceholder")}
            maxLength={100}
            required
            disabled={createLoading}
          />

          {createError && <p className="text-error text-sm">{createError}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCloseCreate}
              disabled={createLoading}
            >
              {t("buttons.cancel")}
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={createLoading || !newChannelName.trim()}
            >
              {createLoading
                ? t("channels.modals.create.loading")
                : t("channels.modals.create.submit")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={renameOpen}
        onClose={onCloseRename}
        title={t("channels.modals.rename.title")}
      >
        <form onSubmit={onSubmitRename} className="flex flex-col gap-3">
          <Input
            label={t("channels.modals.rename.nameLabel")}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            maxLength={100}
            required
            disabled={renameLoading}
          />

          {renameError && <p className="text-error text-sm">{renameError}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCloseRename}
              disabled={renameLoading}
            >
              {t("buttons.cancel")}
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={renameLoading || !renameValue.trim()}
            >
              {renameLoading
                ? t("channels.modals.rename.loading")
                : t("channels.modals.rename.submit")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={onCloseDelete}
        title={t("channels.modals.delete.title")}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-700">
            {t("channels.modals.delete.confirmText")}{" "}
            <span className="font-semibold">#{selected?.name}</span> ?
          </p>

          {deleteError && <p className="text-error text-sm">{deleteError}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCloseDelete}
              disabled={deleteLoading}
            >
              {t("buttons.cancel")}
            </Button>

            <Button
              type="button"
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={onConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading
                ? t("channels.modals.delete.loading")
                : t("channels.modals.delete.submit")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
