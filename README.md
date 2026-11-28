# ERMaster for VS Code 🚀

이클립스(Eclipse)의 대표적인 오픈소스 데이터베이스 모델링 도구인 **ERMaster(`.erm`)를 VS Code에서 그대로 열고 편집할 수 있는 모던 ERD 확장 프로그램**입니다.

Java나 무거운 런타임 종속성 없이 **순수 TypeScript + React Flow + Webview**로 제작되어 매우 가볍고 빠르며, 크로스 플랫폼(Windows, macOS, Linux)을 완벽 지원합니다.

---

## ✨ 주요 기능

- **이클립스 ERMaster(`.erm`) 완벽 호환**:
  - 기존 이클립스 ERMaster에서 작성된 `.erm` XML 파일을 그대로 열고 편집하고 저장할 수 있습니다.
- **모던하고 유려한 ERD 캔버스 (React Flow)**:
  - 부드러운 줌/팬, 드래그앤드롭, 미니맵, 다크모드 테마 지원
  - 테이블 및 메모 노드 시각화
  - 1:N, N:M 외래키 관계선 및 카디널리티 표현
- **논리명 / 물리명 뷰 전환 (View Mode)**:
  - `BOTH`(물리명+논리명 동시 표시), `PHYSICAL`(물리명), `LOGICAL`(논리명) 모드 원클릭 토글
- **테이블 & 컬럼 양방향 편집**:
  - 테이블 더블 클릭 시 컬럼 추가/수정/삭제/순서변경 다이얼로그
  - PK, NOT NULL, 데이터타입, 길이, 기본값, 설명 설정
- **테이블 간 드래그로 관계선 연결**:
  - 테이블의 핸들을 드래그하여 다른 테이블과 연결하면 자동으로 외래키(FK) 관계선 생성
- **실시간 Multi-DBMS DDL 생성**:
  - PostgreSQL, MySQL, Oracle, SQLServer, SQLite 등 타깃 DBMS별 DDL 스크립트 실시간 미리보기 및 클립보드 복사 / VS Code 새 파일로 열기
- **VS Code 네이티브 연동**:
  - `Ctrl + S` 저장 시 `.erm` 파일로 자동 직렬화
  - `ERMaster: Create New ER Diagram (.erm)` 명령어로 손쉽게 새 다이어그램 생성
