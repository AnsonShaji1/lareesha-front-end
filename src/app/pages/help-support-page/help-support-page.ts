import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

interface FAQItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-help-support-page',
  imports: [CommonModule, MatIconModule],
  templateUrl: './help-support-page.html',
  styleUrl: './help-support-page.scss',
})
export class HelpSupportPage {
  faqs: FAQItem[] = [
    {
      question: 'How do I track my order?',
      answer:
        'You can track your order by clicking on "Track Order" in your account menu or by visiting the Orders page. Enter your order number to get the latest status updates.',
      isOpen: false,
    },
    {
      question: 'What is your return policy?',
      answer:
        'We offer a 30-day return policy for all items in their original condition with tags attached. Returns are free for members. Please contact our support team to initiate a return.',
      isOpen: false,
    },
    {
      question: 'How long does shipping take?',
      answer:
        'Standard shipping typically takes 5-7 business days. Express shipping is available for 2-3 business days delivery. You will receive a tracking number once your order ships.',
      isOpen: false,
    },
    {
      question: 'Do you ship internationally?',
      answer:
        'Yes, we ship to select international destinations. Shipping costs and delivery times vary by location. International orders may be subject to customs fees.',
      isOpen: false,
    },
    {
      question: 'How do I change or cancel my order?',
      answer:
        'Orders can be modified or cancelled within 2 hours of placement. Please contact our support team immediately if you need to make changes.',
      isOpen: false,
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards, debit cards, UPI, net banking, and digital wallets through our secure payment gateway powered by Razorpay.',
      isOpen: false,
    },
    {
      question: 'How do I contact customer support?',
      answer:
        'You can reach us via email at support@lareesha-luxe.com or call us at +91 7736335483 (Mon-Sat, 9 AM 6 PM IST). We typically respond to emails within 24 hours.',
      isOpen: false,
    },
    {
      question: 'Are the product images accurate?',
      answer:
        "We strive to display accurate product images and colors. However, actual colors may vary slightly due to screen settings. If you're not satisfied, we offer easy returns.",
      isOpen: false,
    },
  ];

  constructor(private router: Router) {}

  toggleFAQ(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
