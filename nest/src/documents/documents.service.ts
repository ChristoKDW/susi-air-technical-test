import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../data/data-store.service';
import { FIXED_TODAY } from '../common/constants/app.constants';
import { diffDays } from '../common/utils/date.util';

export interface DocumentWithBadge {
  id: string;
  label: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'expired' | 'expiring_soon' | 'valid';
  urgency: 'high' | 'medium' | 'low';
  badge: {
    label: string;
    color: string;
    variant: 'danger' | 'warning' | 'success';
  };
}

@Injectable()
export class DocumentsService {
  constructor(private readonly dataStoreService: DataStoreService) {}

  getDocuments() {
    const today = FIXED_TODAY;
    const warningDays = this.dataStoreService.getWarningDays();
    const rawDocuments = this.dataStoreService.getDocuments();

    const documents: DocumentWithBadge[] = rawDocuments.map((doc) => {
      const daysRemaining = diffDays(doc.expiryDate, today);

      let status: 'expired' | 'expiring_soon' | 'valid';
      let urgency: 'high' | 'medium' | 'low';
      let badge: {
        label: string;
        color: string;
        variant: 'danger' | 'warning' | 'success';
      };

      if (daysRemaining <= 0) {
        status = 'expired';
        urgency = 'high';
        badge = {
          label: 'Expired',
          color: '#EF4444',
          variant: 'danger',
        };
      } else if (daysRemaining <= warningDays) {
        status = 'expiring_soon';
        urgency = 'medium';
        badge = {
          label: 'Expiring Soon',
          color: '#F59E0B',
          variant: 'warning',
        };
      } else {
        status = 'valid';
        urgency = 'low';
        badge = {
          label: 'Valid',
          color: '#10B981',
          variant: 'success',
        };
      }

      return {
        id: doc.id,
        label: doc.label,
        expiryDate: doc.expiryDate,
        daysRemaining,
        status,
        urgency,
        badge,
      };
    });

    return {
      today,
      thresholds: {
        warningDays,
        comment:
          'If daysRemaining <= 0: expired (red). If 0 < daysRemaining <= warningDays: expiring_soon (amber). Else: valid (green).',
      },
      documents,
    };
  }
}
