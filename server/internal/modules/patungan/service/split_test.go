package service

import (
	"testing"

	"github.com/mufarasyid/alurkasku/server/internal/modules/patungan/domain"
)

func TestComputeSplitsEqual(t *testing.T) {
	inputs := []domain.SplitInput{
		{MemberID: "m1"}, {MemberID: "m2"}, {MemberID: "m3"},
		{MemberID: "m4"}, {MemberID: "m5"}, {MemberID: "m6"},
	}
	splits, err := computeSplits(300000, domain.SplitEqual, inputs)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var sum int64
	for _, s := range splits {
		if s.ShareAmount != 50000 {
			t.Fatalf("expected 50000 per member, got %d", s.ShareAmount)
		}
		sum += s.ShareAmount
	}
	if sum != 300000 {
		t.Fatalf("expected sum 300000, got %d", sum)
	}
}

func TestComputeSplitsEqualRemainder(t *testing.T) {
	inputs := []domain.SplitInput{{MemberID: "m1"}, {MemberID: "m2"}, {MemberID: "m3"}}
	splits, err := computeSplits(1000, domain.SplitEqual, inputs)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var sum int64
	for _, s := range splits {
		sum += s.ShareAmount
	}
	if sum != 1000 {
		t.Fatalf("expected sum 1000, got %d", sum)
	}
	if splits[0].ShareAmount != 334 {
		t.Fatalf("expected first member gets remainder, got %d", splits[0].ShareAmount)
	}
}

func TestComputeSplitsNominalMismatch(t *testing.T) {
	inputs := []domain.SplitInput{{MemberID: "m1", ShareAmount: 40000}, {MemberID: "m2", ShareAmount: 40000}}
	if _, err := computeSplits(100000, domain.SplitNominal, inputs); err == nil {
		t.Fatal("expected error for mismatched nominal splits")
	}
}

func TestSimplifyDebts(t *testing.T) {
	balances := []domain.Balance{
		{MemberID: "m1", DisplayName: "Dimas", Net: 50000},
		{MemberID: "m2", DisplayName: "Rizky", Net: -30000},
		{MemberID: "m3", DisplayName: "Budi", Net: -20000},
	}
	suggestions := simplifyDebts(balances)
	if len(suggestions) != 2 {
		t.Fatalf("expected 2 suggestions, got %d", len(suggestions))
	}
	if suggestions[0].Amount != 30000 || suggestions[0].FromName != "Rizky" || suggestions[0].ToName != "Dimas" {
		t.Fatalf("unexpected first suggestion: %+v", suggestions[0])
	}
}
