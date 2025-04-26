import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GamificationPanel from './GamificationPanel';

interface GamificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const GamificationDialog: React.FC<GamificationDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <span className="text-brand-500 text-2xl mr-3">🏆</span> Centre de Gamification
          </DialogTitle>
          <DialogDescription>
            Suivez votre progression, débloquez des badges et relevez des défis
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden h-[calc(80vh-80px)]">
          <GamificationPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GamificationDialog;