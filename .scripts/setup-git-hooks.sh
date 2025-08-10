#!/bin/bash

# Git Hooks 자동 설정 스크립트
# CI 실패 방지를 위한 필수 품질 검사 자동화

set -e

echo "🔧 Setting up Git Hooks for quality control..."

# Git hooks 디렉터리 확인
HOOKS_DIR=".git/hooks"
if [ ! -d "$HOOKS_DIR" ]; then
    echo "❌ Git repository not found. Please run this script from the project root."
    exit 1
fi

# 1. pre-push hook 생성 (필수 - CI 실패 방지)
echo "📝 Creating pre-push hook..."
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/sh
# Auto-generated pre-push hook for CI failure prevention

echo "🔍 Running pre-push quality checks..."

# 현재 브랜치 확인
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" = "main" ]; then
    echo "❌ Direct push to main branch is not allowed!"
    echo "Please create a feature branch and open a Pull Request."
    exit 1
fi

# 1. 포맷팅 검사 및 자동 수정
echo "📝 Running formatter..."
if command -v pnpm >/dev/null 2>&1; then
    if pnpm format; then
        echo "✅ Formatting completed"
        
        # 포맷팅으로 변경된 파일이 있다면 사용자에게 알림
        if ! git diff --quiet; then
            echo "⚠️  Files were auto-formatted. Please review and commit these changes:"
            git diff --name-only
            echo ""
            echo "Run: git add . && git commit --amend --no-edit"
            echo "Then push again."
            exit 1
        fi
    else
        echo "❌ Format failed. Please fix formatting issues."
        exit 1
    fi
else
    echo "⚠️  pnpm not found, skipping format check"
fi

# 2. 린트 검사
echo "🔍 Running linter..."
if command -v pnpm >/dev/null 2>&1; then
    if pnpm lint; then
        echo "✅ Linting passed"
    else
        echo "❌ Lint failed. Please fix linting issues before pushing."
        echo ""
        echo "💡 Try running: pnpm lint --fix"
        exit 1
    fi
else
    echo "⚠️  pnpm not found, skipping lint check"
fi

# 3. 타입 체크
echo "🔧 Running type check..."
if command -v pnpm >/dev/null 2>&1; then
    if pnpm typecheck; then
        echo "✅ Type check passed"
    else
        echo "❌ Type check failed. Please fix type errors before pushing."
        exit 1
    fi
else
    echo "⚠️  pnpm not found, skipping type check"
fi

# 4. 빌드 검증
echo "🏗️  Running build..."
if command -v pnpm >/dev/null 2>&1; then
    if pnpm build; then
        echo "✅ Build completed successfully"
    else
        echo "❌ Build failed. Please fix build errors before pushing."
        exit 1
    fi
else
    echo "⚠️  pnpm not found, skipping build check"
fi

# 5. 테스트 실행 (경고만, 차단하지 않음)
echo "🧪 Running tests..."
if command -v pnpm >/dev/null 2>&1; then
    if pnpm test; then
        echo "✅ All tests passed"
    else
        echo "⚠️  Some tests failed. Consider fixing before pushing."
        echo "   (This will not block the push, but may cause CI issues)"
    fi
else
    echo "⚠️  pnpm not found, skipping tests"
fi

echo ""
echo "🎉 All pre-push quality checks completed!"
echo "✅ Ready to push to remote repository"

EOF

# 2. pre-commit hook 생성 (권장)
echo "📝 Creating pre-commit hook..."
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/sh
# Auto-generated pre-commit hook for staged files quality check

echo "🔍 Running pre-commit checks on staged files..."

# 스테이징된 파일이 있는지 확인
if git diff --cached --quiet; then
    echo "ℹ️  No staged files found, skipping pre-commit checks"
    exit 0
fi

# lint-staged가 있는지 확인하고 실행
if command -v pnpm >/dev/null 2>&1; then
    # package.json에 lint-staged 설정이 있는지 확인
    if grep -q "lint-staged" package.json 2>/dev/null; then
        if pnpm lint-staged; then
            echo "✅ Pre-commit checks passed"
        else
            echo "❌ Pre-commit checks failed. Please fix issues and re-add files."
            exit 1
        fi
    else
        echo "ℹ️  lint-staged not configured, running basic checks..."
        # 기본적인 린트 체크만 수행
        if pnpm lint; then
            echo "✅ Basic lint check passed"
        else
            echo "❌ Lint check failed. Please fix issues before committing."
            exit 1
        fi
    fi
else
    echo "⚠️  pnpm not found, skipping pre-commit checks"
fi

EOF

# 실행 권한 부여
chmod +x "$HOOKS_DIR/pre-push"
chmod +x "$HOOKS_DIR/pre-commit"

echo ""
echo "✅ Git hooks have been successfully installed!"
echo ""
echo "📋 Installed hooks:"
echo "   • pre-push: Runs format, lint, typecheck, build before pushing"
echo "   • pre-commit: Runs lint-staged or basic lint on staged files"
echo ""
echo "🚨 Important notes:"
echo "   • These hooks will prevent pushes if quality checks fail"
echo "   • Direct pushes to main branch are blocked"
echo "   • Auto-formatting may require you to commit changes before pushing"
echo ""
echo "🎯 This setup will prevent CI failures due to:"
echo "   ❌ Linting errors"
echo "   ❌ Type errors" 
echo "   ❌ Build failures"
echo "   ❌ Formatting issues"
echo ""
echo "🔧 To bypass hooks temporarily (not recommended):"
echo "   git push --no-verify"
echo ""
echo "Happy coding! 🚀"