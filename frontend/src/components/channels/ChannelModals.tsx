"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Channel } from "@/lib/api/channels";

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
  return (
    <>
      <Modal open={createOpen} onClose={onCloseCreate} title="Nouveau canal">
        <form onSubmit={onSubmitCreate} className="flex flex-col gap-3">
          <Input
            label="Nom du canal"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="Nom du canal"
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
              Annuler
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={createLoading || !newChannelName.trim()}
            >
              {createLoading ? "Création…" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={renameOpen}
        onClose={onCloseRename}
        title="Renommer le canal"
      >
        <form onSubmit={onSubmitRename} className="flex flex-col gap-3">
          <Input
            label="Nouveau nom"
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
              Annuler
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={renameLoading || !renameValue.trim()}
            >
              {renameLoading ? "En cours…" : "Renommer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={onCloseDelete}
        title="Supprimer le canal"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-700">
            Tu es sûr de vouloir supprimer{" "}
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
              Annuler
            </Button>

            <Button
              type="button"
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={onConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Suppression…" : "Supprimer"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
