import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { Article } from '@models/article';

@Component({
  selector: 'app-article-search-result-modal',
  templateUrl: './article-search-result-modal.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ArticleSearchResultModalComponent {

  @Input() articles: Article[] = [];

  constructor(private modalController: ModalController) { }

  dismissModal() {
    this.modalController.dismiss();
  }

  selectArticle(article: Article) {
    this.modalController.dismiss(article);
  }
}
