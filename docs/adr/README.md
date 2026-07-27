# ADR ガイドライン

このリポジトリでは、アーキテクチャ上の重要な意思決定を **ADR (Architecture Decision Record)** として記録します。

## 保存場所
- すべての ADR は `docs/adr/` ディレクトリに Markdown 形式で保存します。
- ファイル名は `NNN-descriptive-title.md` の形式で、`NNN` は 3 桁の連番です。

## 内容の必須要素
1. **タイトル** (`# ADR NNN – Title`)
2. **作成日** (`**Creation Date**: YYYY-MM-DD`)
3. **ステータス** (`**Status**: Proposed / Accepted / Rejected / Superseded / Deprecated`)
4. **背景** – 問題や課題の説明
5. **結論** – 取った決定と根拠
6. **選択肢** – 検討した代替案とそれぞれの利点・欠点
7. **考慮事項** – チームの慣れ、将来的な拡張、保守性など


## ステータス遷移
- **Proposed**: 検討中。チームでレビューし、合意が得られたら **Accepted** に変更。
- **Accepted**: 正式に採用。実装に反映し、必要に応じて **Superseded** や **Deprecated** に遷移。
- **Rejected**: 採用しないことが決定。
- **Superseded**: 後続の ADR に置き換えられた。
- **Deprecated**: 将来的に削除対象となる。

## 更新手順
1. 既存の ADR を編集する場合は、**ステータス** と **更新日** を明記し、変更内容を追記します。
2. 新しい決定が必要な場合は、次の連番で新規 ADR を作成し、参照元の ADR から **Superseded** へ遷移させます。

## 参考リンク
- Michael Nygard, *Documenting Architecture Decisions*, 2011
- https://github.com/joelparkerhenderson/architecture_decision_record
