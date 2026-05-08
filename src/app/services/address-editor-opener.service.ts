import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { AddressDialogComponent } from '../components/address-dialog/address-dialog';

/** Matches `address-dialog.scss` mobile layout breakpoint */
const ADDRESS_EDITOR_MOBILE = '(max-width: 600px)';

/**
 * Opens the shared address editor as a centered dialog on larger screens,
 * or as a bottom sheet on narrow viewports (clearer mobile UX).
 */
@Injectable({ providedIn: 'root' })
export class AddressEditorOpenerService {
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly breakpointObserver = inject(BreakpointObserver);

  open(data?: unknown): Observable<boolean | undefined> {
    const payload = data ?? {};

    if (this.breakpointObserver.isMatched(ADDRESS_EDITOR_MOBILE)) {
      const ref = this.bottomSheet.open(AddressDialogComponent, {
        data: payload,
        panelClass: 'll-address-bottom-sheet-panel',
      });
      return ref.afterDismissed();
    }

    const ref = this.dialog.open(AddressDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: payload,
    });
    return ref.afterClosed();
  }
}
