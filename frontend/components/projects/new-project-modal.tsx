"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Project } from "@/types";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [organization, setOrganization] = useState("");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await api.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        organization: organization.trim() || undefined,
        status,
      });

      onProjectCreated(created);
      onClose();
      // Reset form
      setName("");
      setDescription("");
      setLocation("");
      setOrganization("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to register project dossier.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Environmental Impact Project"
      subtitle="Register an auditable impact dossier for photographic and drone media verification."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-mono">
            {error}
          </div>
        )}

        <Input
          label="Project Title *"
          placeholder="e.g. River Restoration Initiative"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Lead Organization"
            placeholder="e.g. Global Wetland Trust"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />

          <Input
            label="Geographic Location / Biome"
            placeholder="e.g. Severn Basin, UK"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1.5 font-mono">
            Operational Scope & Methodology
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of ecological intervention, monitoring scope, and ground verification goals..."
            className="w-full rounded-none border border-[#E2DFD8] bg-white p-3 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] font-sans"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E2DFD8]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="sage"
            size="sm"
            loading={submitting}
          >
            Register Dossier
          </Button>
        </div>
      </form>
    </Modal>
  );
};
