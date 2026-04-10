"""
FEA Integration Package — Sai Rolotech Smart Engines v2.3.0
Architecture: mesh generation → material cards → contact setup → solver deck → result import

Solver backends:
  - calculix : open-source (ccx), Abaqus-compatible .inp format
  - abaqus   : commercial Abaqus (Dassault Systèmes), same .inp format

Level 4 FEA (v2.3.0):
  - 3D mesh generation (C3D8R hexahedral)
  - Material anisotropy (Hill48, Barlat YLD2000p)
  - Friction calibration
  - Springback + residual stress coupling
  - Die face optimization

Runtime status:
  If neither solver binary is found on PATH, the pipeline returns
  EXTERNAL_SOLVER_REQUIRED with all decks pre-written and ready to run.
"""

from .mesh_generator import StripMesh, RollSurface, generate_strip_mesh, generate_roll_rigid_surface
from .material_cards import FEAMaterialCard, build_material_card
from .contact_setup import ContactSetup, build_contact_setup
from .deck_writer import write_calculix_deck, write_abaqus_deck, FEADeckPaths
from .result_importer import import_calculix_results, import_abaqus_odb_text, FEAResults
from .fea_pipeline import run_fea_pipeline, FEAPipelineResult

# Level 4 FEA exports
from .level4_fea_engine import (
    Level4FEAPipeline,
    Level4Config,
    run_level4_fea,
    MaterialAnisotropyData,
    Hill48Anisotropy,
    BarlatYLD2000p,
    FrictionCalibration,
    Mesh3DGenerator,
    Mesh3DConfig,
    SpringbackCoupling,
    DieFaceOptimizer,
    DieOptimizationConfig,
)

# Solver management (Level 3 solver detection)
from .solver_manager import (
    detect_all_solvers,
    detect_calculix,
    detect_abaqus,
    run_solver,
    SolverInfo,
    get_calculix_install_instructions,
    get_platform,
    CALCULIX_AVAILABLE,
    ABAQUS_AVAILABLE,
)

__all__ = [
    # Level 3 FEA
    "StripMesh", "RollSurface", "generate_strip_mesh", "generate_roll_rigid_surface",
    "FEAMaterialCard", "build_material_card",
    "ContactSetup", "build_contact_setup",
    "write_calculix_deck", "write_abaqus_deck", "FEADeckPaths",
    "import_calculix_results", "import_abaqus_odb_text", "FEAResults",
    "run_fea_pipeline", "FEAPipelineResult",
    # Solver management
    "detect_all_solvers", "detect_calculix", "detect_abaqus",
    "run_solver", "SolverInfo",
    "get_calculix_install_instructions", "get_platform",
    "CALCULIX_AVAILABLE", "ABAQUS_AVAILABLE",
    # Level 4 FEA
    "Level4FEAPipeline",
    "Level4Config",
    "run_level4_fea",
    "MaterialAnisotropyData",
    "Hill48Anisotropy",
    "BarlatYLD2000p",
    "FrictionCalibration",
    "Mesh3DGenerator",
    "Mesh3DConfig",
    "SpringbackCoupling",
    "DieFaceOptimizer",
    "DieOptimizationConfig",
]
